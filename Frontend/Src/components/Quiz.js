import React, { useState } from "react";
import api from "../api/api";

export default function Quiz({ material }) {
  const [quiz, setQuiz] = useState(null);
  const [quizType, setQuizType] = useState("mcq");
  const [numQuestions, setNumQuestions] = useState(5);
  const [answers, setAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setAttempt(null);
    setAnswers({});
    try {
      const result = await api.generateQuiz(material.id, quizType, numQuestions);
      setQuiz(result);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await api.submitQuiz(quiz.id, answers);
      setAttempt(result);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="card">
        {error && <div className="error-banner">{error}</div>}
        <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Create a Quiz</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.85rem" }}>Question Type</label>
            <select value={quizType} onChange={(e) => setQuizType(e.target.value)}>
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.85rem" }}>Number of Questions</label>
            <input type="number" min={3} max={20} value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} style={{ width: 90 }} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating quiz..." : "Generate Quiz"}
        </button>
      </div>
    );
  }

  if (attempt) {
    return (
      <div>
        <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 6px" }}>{attempt.score_pct}%</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            {attempt.correct_count} of {attempt.total} correct
          </p>
        </div>

        {attempt.weak_topics.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Weak Topics</h3>
            {attempt.weak_topics.map((t) => (
              <p key={t.topic} style={{ margin: "4px 0" }}>
                <strong>{t.topic}</strong> — {(t.accuracy * 100).toFixed(0)}% accuracy
              </p>
            ))}
          </div>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Review</h3>
          {attempt.results.map((r, i) => (
            <div key={r.question_id} className="quiz-question">
              <p style={{ fontWeight: 600 }}>{i + 1}. {r.question}</p>
              <p style={{ color: r.is_correct ? "var(--mint)" : "var(--coral)", margin: "4px 0" }}>
                {r.is_correct ? "✓ Correct" : "✗ Incorrect"} — Your answer: {r.student_answer || "(blank)"}
              </p>
              {!r.is_correct && <p style={{ margin: "4px 0" }}>Correct answer: {r.correct_answer}</p>}
              {r.explanation && <p style={{ margin: "4px 0", color: "var(--ink-soft)", fontSize: "0.9rem" }}>{r.explanation}</p>}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => { setQuiz(null); setAttempt(null); }}>
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {error && <div className="error-banner">{error}</div>}
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="quiz-question">
          <p style={{ fontWeight: 600 }}>{i + 1}. {q.question}</p>

          {q.type === "mcq" &&
            q.options.map((opt) => (
              <div
                key={opt}
                className={`option-row ${answers[q.id] === opt ? "selected" : ""}`}
                onClick={() => handleAnswer(q.id, opt)}
              >
                {opt}
              </div>
            ))}

          {q.type === "true_false" &&
            ["True", "False"].map((opt) => (
              <div
                key={opt}
                className={`option-row ${answers[q.id] === opt ? "selected" : ""}`}
                onClick={() => handleAnswer(q.id, opt)}
              >
                {opt}
              </div>
            ))}

          {q.type === "short_answer" && (
            <textarea
              rows={2}
              placeholder="Type your answer..."
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Grading..." : "Submit Quiz"}
      </button>
    </div>
  );
}
