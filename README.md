
# StudyAI — Smart AI Study Companion & Quiz Generator

An AI-powered study platform: upload notes/PDF/DOCX → get AI summaries,
flashcards, adaptive quizzes, weak-topic analysis, and a personalized
7-day study schedule.

**Stack:** React.js · Python Flask · Groq (Llama 3.3 70B Versatile) · Firebase Firestore (optional, with local JSON fallback)

---

## 1. Project structure

```
studyai/
├── backend/
│   ├── app.py                  # Flask API (all routes)
│   ├── services/
│   │   ├── ai_service.py       # Groq prompts: summary, flashcards, quiz, schedule
│   │   ├── storage_service.py  # Firestore OR local JSON storage
│   │   └── file_processor.py   # PDF / DOCX / TXT text extraction
│   ├── data/                   # local JSON "database" (auto-created)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/         # Dashboard, Upload, Summary, Flashcards, Quiz, Schedule, Navbar
    │   ├── api/api.js          # Axios calls to the Flask backend
    │   └── App.js
    └── package.json
```

---

## 2. Get a free Groq API key (required)

1. Go to **https://console.groq.com**
2. Sign up / log in (free).
3. Open **API Keys** in the left sidebar → **Create API Key**.
4. Copy the key (starts with `gsk_...`). You won't see it again.

## 3. (Optional) Firebase Firestore

The app works completely fine **without** this — it automatically falls
back to local JSON files in `backend/data/`. Only set this up if you
specifically need cloud storage for your submission.

1. Go to https://console.firebase.google.com → Create a project.
2. Build → Firestore Database → Create database (test mode is fine for a college project).
3. Project Settings (gear icon) → Service Accounts → **Generate new private key**.
4. Save the downloaded JSON file somewhere on your machine (do **not** commit it).
5. Point `FIREBASE_CREDENTIALS_PATH` at it in your `.env` (step 4 below).

---

## 4. Backend setup (Flask)

```bash
cd backend
python -m venv venv

# activate it:
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# create your real env file
cp .env.example .env         # macOS/Linux
copy .env.example .env       # Windows
```

Open `backend/.env` and paste in your real key:

```
GROQ_API_KEY=gsk_your_real_key_here
GROQ_MODEL=llama-3.3-70b-versatile
FIREBASE_CREDENTIALS_PATH=
FLASK_PORT=5000
FLASK_DEBUG=True
```

Run it:

```bash
python app.py
```

You should see `Running on http://0.0.0.0:5000` and a storage log line
telling you whether it's using Firestore or local JSON.

Test it's alive: open **http://localhost:5000/api/health** → `{"status": "ok"}`

---

## 5. Frontend setup (React)

Open a **second terminal** (leave Flask running in the first):

```bash
cd frontend
npm install
npm start
```

This opens **http://localhost:3000** automatically. It talks to the
Flask backend at `http://localhost:5000/api` by default (see
`frontend/src/api/api.js` — override with a `REACT_APP_API_URL` env var
if you deploy the backend elsewhere).

---

## 6. Using the app

1. **Dashboard** — see all uploaded materials + analytics (score trend, weak topics).
2. **Upload Material** — drag in a PDF/DOCX/TXT, or paste raw text.
3. Inside a material, use the tabs:
   - **Summary** — structured Markdown summary (overview, key concepts, definitions, principles, revision notes).
   - **Flashcards** — flip cards, mark known, shuffle, track mastery.
   - **Quiz** — choose MCQ / True-False / Short Answer, take it, get scored + weak topics.
   - **Schedule** — generates a 7-day plan that prioritizes topics you got wrong.
