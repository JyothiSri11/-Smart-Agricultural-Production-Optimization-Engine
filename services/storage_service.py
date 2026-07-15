"""
Storage layer for StudyAI.

If FIREBASE_CREDENTIALS_PATH is set (and valid), data is stored in
Firestore. Otherwise everything falls back to local JSON files under
backend/data/ so the app works immediately with zero cloud setup.
"""
import os
import json
import uuid
import threading
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

COLLECTIONS = ["materials", "flashcards", "quizzes", "attempts", "schedules"]

_lock = threading.Lock()
_firebase_db = None
_use_firebase = False


def init_storage():
    """Try to initialize Firebase; silently fall back to local JSON."""
    global _firebase_db, _use_firebase
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
    if not cred_path:
        print("[storage] No FIREBASE_CREDENTIALS_PATH set -> using local JSON storage.")
        return
    if not os.path.exists(cred_path):
        print(f"[storage] Firebase credentials file not found at '{cred_path}' -> using local JSON storage.")
        return
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_db = firestore.client()
        _use_firebase = True
        print("[storage] Connected to Firebase Firestore.")
    except Exception as e:
        print(f"[storage] Firebase init failed ({e}) -> using local JSON storage.")


def _local_path(collection):
    return os.path.join(DATA_DIR, f"{collection}.json")


def _read_local(collection):
    path = _local_path(collection)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _write_local(collection, data):
    path = _local_path(collection)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def new_id():
    return str(uuid.uuid4())


def save_doc(collection, doc_id, data):
    data = dict(data)
    data["id"] = doc_id
    data.setdefault("created_at", datetime.utcnow().isoformat())
    data["updated_at"] = datetime.utcnow().isoformat()

    if _use_firebase:
        _firebase_db.collection(collection).document(doc_id).set(data)
        return data

    with _lock:
        store = _read_local(collection)
        store[doc_id] = data
        _write_local(collection, store)
    return data


def get_doc(collection, doc_id):
    if _use_firebase:
        snap = _firebase_db.collection(collection).document(doc_id).get()
        return snap.to_dict() if snap.exists else None

    store = _read_local(collection)
    return store.get(doc_id)


def list_docs(collection, filter_fn=None):
    if _use_firebase:
        docs = [d.to_dict() for d in _firebase_db.collection(collection).stream()]
    else:
        docs = list(_read_local(collection).values())
    if filter_fn:
        docs = [d for d in docs if filter_fn(d)]
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return docs


def delete_doc(collection, doc_id):
    if _use_firebase:
        _firebase_db.collection(collection).document(doc_id).delete()
        return
    with _lock:
        store = _read_local(collection)
        store.pop(doc_id, None)
        _write_local(collection, store)
