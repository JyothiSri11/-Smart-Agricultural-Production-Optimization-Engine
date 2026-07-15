"""
All Groq (Llama 3.3 70B Versatile) calls live here, one function per
AI-powered feature. Every function returns plain Python data (dict/list)
so Flask routes can just json-ify it.
"""
import os
import json
from groq import Groq

_client = None
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Study material is long; keep prompts within a safe character budget.
MAX_CONTENT_CHARS = 12000


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_api_key_here":
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add a real key to backend/.env "
                "(get one free at https://console.groq.com)."
            )
        _client = Groq(api_key=api_key)
    return _client


def _chat_json(system_prompt, user_prompt, temperature=0.4):
    """Call Groq and parse a strict-JSON response."""
    client = _get_client()
    completion = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = completion.choices[0].message.content
    return json.loads(raw)


def _chat_text(system_prompt, user_prompt, temperature=0.4):
    client = _get_client()
    completion = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.choices[0].message.content


def _truncate(content):
    if len(content) > MAX_CONTENT_CHARS:
        return content[:MAX_CONTENT_CHARS] + "\n...[truncated for length]"
    return content


# ---------------------------------------------------------------- Summary
def generate_summary(content, title=""):
    system = (
        "You are an expert study coach who writes clear, exam-focused "
        "summaries for students. Always respond in well-structured Markdown."
    )
    user = f"""Summarize the following study material titled "{title}".

Return Markdown with exactly these sections:
## Topic Overview
## Key Concepts
## Important Definitions
## Core Principles
## Quick Revision Notes
(bullet points, last-minute cram style)

STUDY MATERIAL:
{_truncate(content)}
"""
    text = _chat_text(system, user)
    return {"summary_markdown": text}


# ------------------------------------------------------------ Flashcards
def generate_flashcards(content, count=10):
    system = (
        "You are an AI that creates high-quality flashcards for students. "
        "Always respond with strict JSON only, no prose outside the JSON."
    )
    user = f"""Create {count} flashcards from the study material below.

Respond as JSON of the form:
{{
  "flashcards": [
    {{"question": "...", "answer": "...", "topic": "...", "difficulty": "easy|medium|hard"}}
  ]
}}

STUDY MATERIAL:
{_truncate(content)}
"""
    data = _chat_json(system, user)
    return data.get("flashcards", [])


# ---------------------------------------------------------------- Quiz
def generate_quiz(content, quiz_type="mcq", num_questions=5):
    """quiz_type: 'mcq' | 'true_false' | 'short_answer'"""
    type_instructions = {
        "mcq": (
            'Each question needs "options" (array of 4 strings) and '
            '"correct_answer" (must exactly match one option).'
        ),
        "true_false": (
            'Each question\'s "correct_answer" must be exactly "True" or "False". '
            'Omit "options".'
        ),
        "short_answer": (
            'Each question needs "correct_answer" as a concise ideal answer '
            '(1-2 sentences). Omit "options".'
        ),
    }
    system = (
        "You are an AI quiz generator for a study platform. "
        "Always respond with strict JSON only, no prose outside the JSON."
    )
    user = f"""Create {num_questions} {quiz_type} questions from the study material below.
{type_instructions.get(quiz_type, type_instructions['mcq'])}

Respond as JSON of the form:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "...",
      "topic": "...",
      "explanation": "why this is the correct answer"
    }}
  ]
}}

STUDY MATERIAL:
{_truncate(content)}
"""
    data = _chat_json(system, user)
    questions = data.get("questions", [])
    # tag each with an id and the quiz_type for the frontend
    for i, q in enumerate(questions):
        q["id"] = f"q{i+1}"
        q["type"] = quiz_type
    return questions


def grade_short_answer(question, ideal_answer, student_answer):
    """Use the LLM to grade a free-text short-answer response."""
    system = (
        "You are a fair, encouraging exam grader. Always respond with strict JSON only."
    )
    user = f"""Question: {question}
Ideal answer: {ideal_answer}
Student's answer: {student_answer}

Grade the student's answer for correctness and completeness compared to the
ideal answer. Respond as JSON:
{{"is_correct": true|false, "score": 0-1, "feedback": "one short sentence"}}
"""
    return _chat_json(system, user, temperature=0.2)


# ----------------------------------------------------- Weak topic analysis
def identify_weak_topics(quiz_results):
    """
    quiz_results: list of {"topic": str, "is_correct": bool}
    Returns list of weak topic names, weakest first.
    """
    from collections import defaultdict

    stats = defaultdict(lambda: {"correct": 0, "total": 0})
    for r in quiz_results:
        topic = r.get("topic") or "General"
        stats[topic]["total"] += 1
        if r.get("is_correct"):
            stats[topic]["correct"] += 1

    weak = []
    for topic, s in stats.items():
        accuracy = s["correct"] / s["total"] if s["total"] else 1
        if accuracy < 0.7:
            weak.append({"topic": topic, "accuracy": round(accuracy, 2), "attempts": s["total"]})

    weak.sort(key=lambda t: t["accuracy"])
    return weak


# --------------------------------------------------------- Study schedule
def generate_schedule(content, weak_topics=None, days=7, title=""):
    weak_topics = weak_topics or []
    system = (
        "You are an AI academic planner who builds realistic, motivating "
        "study schedules. Always respond with strict JSON only."
    )
    weak_note = (
        f"Prioritize these weak topics the student struggled with: {', '.join(weak_topics)}."
        if weak_topics
        else "No prior weak topics identified yet -- build a balanced plan across all material."
    )
    user = f"""Create a {days}-day personalized study schedule for the material titled "{title}".
{weak_note}

Respond as JSON:
{{
  "schedule": [
    {{
      "day": 1,
      "date_label": "Day 1",
      "focus_topics": ["..."],
      "tasks": [
        {{"time_slot": "9:00 AM - 10:00 AM", "task": "...", "type": "review|practice|quiz|break"}}
      ],
      "study_tip": "one motivating, actionable tip for the day"
    }}
  ]
}}

STUDY MATERIAL:
{_truncate(content)}
"""
    data = _chat_json(system, user)
    return data.get("schedule", [])
