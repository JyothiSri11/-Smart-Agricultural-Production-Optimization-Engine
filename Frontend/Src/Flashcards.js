import React, { useState } from "react";
import api from "../api/api";

export default function Flashcards({ material }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(10);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.generateFlashcards(material.id, count);
      setCards(result.cards);
      setIndex(0);
      setFlipped(false);
      setMastered(new Set());
    } catch (err) {
      setError(err?.response?.data?.error || "Could not generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const shuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setIndex(0);
    setFlipped(false);
  };

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  const toggleMastered = () => {
    const card = cards[index];
    const copy = new Set(mastered);
    if (copy.has(card.id)) copy.delete(card.id);
    else copy.add(card.id);
    setMastered(copy);
  };

  if (cards.length === 0) {
    return (
      <div className="card">
        {error && <div className="error-banner">{error}</div>}
        <div className="empty-state">
          <p>No flashcards yet.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <label style={{ fontSize: "0.9rem" }}>Number of cards:</label>
            <input
              type="number"
              min={5}
              max={30}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{ width: 70 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div>
      <div className="flashcard-stage">
        <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
          <div className="flashcard-face front">{card.question}</div>
          <div className="flashcard-face back">{card.answer}</div>
        </div>
        <div className="flashcard-meta">
          <span className={`badge badge-${card.difficulty || "medium"}`}>{card.difficulty || "medium"}</span>
          <span>{card.topic}</span>
          <span>{index + 1} / {cards.length}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={prev}>← Prev</button>
        <button
          className="btn btn-primary"
          onClick={toggleMastered}
          style={mastered.has(card.id) ? { background: "#3F9E7B", color: "#fff" } : {}}
        >
          {mastered.has(card.id) ? "✓ Mastered" : "Mark as Known"}
        </button>
        <button className="btn btn-secondary" onClick={next}>Next →</button>
        <button className="btn btn-secondary" onClick={shuffle}>Shuffle</button>
      </div>

      <p style={{ textAlign: "center", marginTop: 16, color: "var(--ink-soft)" }}>
        {mastered.size} of {cards.length} concepts mastered
      </p>

      <div style={{ textAlign: "center" }}>
        <button className="btn btn-secondary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Regenerate Deck"}
        </button>
      </div>
    </div>
  );
}
