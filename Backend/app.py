import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from services import storage_service as db
from services import ai_service as ai
from services.file_processor import extract_text, UnsupportedFileType

app = Flask(__name__)
CORS(app)
db.init_storage()

# --------------------------------------------------------------------------
# Materials: upload + retrieval
# --------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/materials/upload", methods=["POST"])
def upload_material():
    title = request.form.get("title", "").strip()

    if "file" in request.files and request.files["file"].filename:
        try:
            content = extract_text(request.files["file"])
        except UnsupportedFileType as e:
            return jsonify({"error": str(e)}), 400
        if not title:
            title = request.files["file"].filename
    else:
        content = (request.form.get("text") or "").strip()

    if not content:
        return jsonify({"error": "No file or text content provided."}), 400

    material_id = db.new_id()
    material = db.save_doc("materials", material_id, {
        "title": title or "Untitled Material",
        "content": content,
        "char_count": len(content),
    })
    return jsonify(material), 201


@app.route("/api/materials", methods=["GET"])
def list_materials():
    materials = db.list_docs("materials")
    # don't ship full content in the list view
    slim = [{k: v for k, v in m.items() if k != "content"} for m in materials]
    return jsonify(slim)


@app.route("/api/materials/<material_id>", methods=["GET"])
def get_material(material_id):
    material = db.get_doc("materials", material_id)
    if not material:
        return jsonify({"error": "Material not found."}), 404
    return jsonify(material)


@app.route("/api/materials/<material_id>", methods=["DELETE"])
def delete_material(material_id):
    db.delete_doc("materials", material_id)
    return jsonify({"deleted": True})


def _get_material_or_404(material_id):
    material = db.get_doc("materials", material_id)
    if not material:
        return None
    return material


# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------

@app.route("/api/materials/<material_id>/summary", methods=["POST"])
def create_summary(material_id):
    material = _get_material_or_404(material_id)
    if not material:
        return jsonify({"error": "Material not found."}), 404
    try:
        result = ai.generate_summary(material["content"], material.get("title", ""))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    db.save_doc("materials", material_id, {**material, "summary_markdown": result["summary_markdown"]})
    return jsonify(result)


# --------------------------------------------------------------------------
# Flashcards
# --------------------------------------------------------------------------

@app.route("/api/materials/<material_id>/flashcards", methods=["POST"])
def create_flashcards(material_id):
    material = _get_material_or_404(material_id)
    if not material:
        return jsonify({"error": "Material not found."}), 404
    count = int((request.json or {}).get("count", 10))
    try:
        cards = ai.generate_flashcards(material["content"], count=count)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    for i, c in enumerate(cards):
        c["id"] = f"fc{i+1}"

    deck_id = db.new_id()
    db.save_doc("flashcards", deck_id, {
        "material_id": material_id,
        "material_title": material.get("title", ""),
        "cards": cards,
    })
    return jsonify({"deck_id": deck_id, "cards": cards}), 201


@app.route("/api/flashcards/<deck_id>", methods=["GET"])
def get_flashcard_deck(deck_id):
    deck = db.get_doc("flashcards", deck_id)
    if not deck:
        return jsonify({"error": "Deck not found."}), 404
    return jsonify(deck)


# --------------------------------------------------------------------------
# Quiz
# --------------------------------------------------------------------------

@app.route("/api/materials/<material_id>/quiz", methods=["POST"])
def create_quiz(material_id):
    material = _get_material_or_404(material_id)
    if not material:
        return jsonify({"error": "Material not found."}), 404

    body = request.json or {}
    quiz_type = body.get("quiz_type", "mcq")
    num_questions = int(body.get("num_questions", 5))

    try:
        questions = ai.generate_quiz(material["content"], quiz_type=quiz_type, num_questions=num_questions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    quiz_id = db.new_id()
    quiz = db.save_doc("quizzes", quiz_id, {
        "material_id": material_id,
        "material_title": material.get("title", ""),
        "quiz_type": quiz_type,
        "questions": questions,
    })
    return jsonify(quiz), 201


@app.route("/api/quizzes/<quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = db.get_doc("quizzes", quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found."}), 404
    return jsonify(quiz)


@app.route("/api/quizzes/<quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id):
    quiz = db.get_doc("quizzes", quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found."}), 404

    answers = (request.json or {}).get("answers", {})  # {question_id: student_answer}
    results = []
    correct_count = 0

    for q in quiz["questions"]:
        qid = q["id"]
        student_answer = (answers.get(qid) or "").strip()
        if q["type"] == "short_answer":
            try:
                grade = ai.grade_short_answer(q["question"], q["correct_answer"], student_answer)
                is_correct = bool(grade.get("is_correct"))
                feedback = grade.get("feedback", "")
            except Exception:
                is_correct = student_answer.lower() == q["correct_answer"].strip().lower()
                feedback = ""
        else:
            is_correct = student_answer.strip().lower() == q["correct_answer"].strip().lower()
            feedback = ""

        if is_correct:
            correct_count += 1

        results.append({
            "question_id": qid,
            "question": q["question"],
            "topic": q.get("topic", "General"),
            "student_answer": student_answer,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
            "feedback": feedback,
        })

    total = len(quiz["questions"])
    score_pct = round((correct_count / total) * 100, 1) if total else 0
    weak_topics = ai.identify_weak_topics(results)

    attempt_id = db.new_id()
    attempt = db.save_doc("attempts", attempt_id, {
        "quiz_id": quiz_id,
        "material_id": quiz["material_id"],
        "material_title": quiz.get("material_title", ""),
        "score_pct": score_pct,
        "correct_count": correct_count,
        "total": total,
        "results": results,
        "weak_topics": weak_topics,
    })
    return jsonify(attempt), 201


@app.route("/api/attempts", methods=["GET"])
def list_attempts():
    return jsonify(db.list_docs("attempts"))


# --------------------------------------------------------------------------
# Study Schedule
# --------------------------------------------------------------------------

@app.route("/api/materials/<material_id>/schedule", methods=["POST"])
def create_schedule(material_id):
    material = _get_material_or_404(material_id)
    if not material:
        return jsonify({"error": "Material not found."}), 404

    body = request.json or {}
    days = int(body.get("days", 7))

    # pull weak topics from the most recent attempt tied to this material
    attempts = db.list_docs("attempts", filter_fn=lambda a: a.get("material_id") == material_id)
    weak_topics = []
    if attempts:
        weak_topics = [t["topic"] for t in attempts[0].get("weak_topics", [])]

    try:
        schedule = ai.generate_schedule(material["content"], weak_topics=weak_topics, days=days, title=material.get("title", ""))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    schedule_id = db.new_id()
    doc = db.save_doc("schedules", schedule_id, {
        "material_id": material_id,
        "material_title": material.get("title", ""),
        "days": schedule,
        "based_on_weak_topics": weak_topics,
    })
    return jsonify(doc), 201


@app.route("/api/schedules/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id):
    schedule = db.get_doc("schedules", schedule_id)
    if not schedule:
        return jsonify({"error": "Schedule not found."}), 404
    return jsonify(schedule)


# --------------------------------------------------------------------------
# Dashboard / analytics
# --------------------------------------------------------------------------

@app.route("/api/analytics", methods=["GET"])
def analytics():
    attempts = db.list_docs("attempts")
    materials = db.list_docs("materials")

    total_attempts = len(attempts)
    avg_score = round(sum(a["score_pct"] for a in attempts) / total_attempts, 1) if total_attempts else 0

    topic_stats = {}
    for a in attempts:
        for r in a.get("results", []):
            topic = r.get("topic", "General")
            s = topic_stats.setdefault(topic, {"correct": 0, "total": 0})
            s["total"] += 1
            if r.get("is_correct"):
                s["correct"] += 1

    topic_breakdown = [
        {
            "topic": topic,
            "accuracy": round((s["correct"] / s["total"]) * 100, 1) if s["total"] else 0,
            "attempts": s["total"],
        }
        for topic, s in topic_stats.items()
    ]
    topic_breakdown.sort(key=lambda t: t["accuracy"])

    score_trend = [
        {"date": a["created_at"], "score_pct": a["score_pct"], "material_title": a.get("material_title", "")}
        for a in sorted(attempts, key=lambda x: x["created_at"])
    ]

    return jsonify({
        "total_materials": len(materials),
        "total_attempts": total_attempts,
        "average_score": avg_score,
        "topic_breakdown": topic_breakdown,
        "score_trend": score_trend,
        "weakest_topics": topic_breakdown[:5],
    })


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
