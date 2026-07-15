import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Summary from "./Summary";
import Flashcards from "./Flashcards";
import Quiz from "./Quiz";
import Schedule from "./Schedule";

const TABS = ["Summary", "Flashcards", "Quiz", "Schedule"];

export default function MaterialWorkspace() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [tab, setTab] = useState("Summary");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMaterial(id).then(setMaterial).catch(() => setError("Could not load this material."));
  }, [id]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!material) return <div className="loading">Loading material...</div>;

  return (
    <div>
      <h1 className="page-title">{material.title}</h1>
      <p className="page-subtitle">{material.char_count.toLocaleString()} characters of study material</p>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Summary" && <Summary material={material} />}
      {tab === "Flashcards" && <Flashcards material={material} />}
      {tab === "Quiz" && <Quiz material={material} />}
      {tab === "Schedule" && <Schedule material={material} />}
    </div>
  );
}
