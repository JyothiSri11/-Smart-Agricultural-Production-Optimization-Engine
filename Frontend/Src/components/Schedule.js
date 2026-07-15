import React, { useState } from "react";
import api from "../api/api";

export default function Schedule({ material }) {
  const [schedule, setSchedule] = useState(null);
  const [days, setDays] = useState(7);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.generateSchedule(material.id, days);
      setSchedule(result);
      setActiveDay(0);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) {
    return (
      <div className="card">
        {error && <div className="error-banner">{error}</div>}
        <div className="empty-state">
          <p>No study schedule yet.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <label style={{ fontSize: "0.9rem" }}>Number of days:</label>
            <input type="number" min={3} max={14} value={days} onChange={(e) => setDays(e.target.value)} style={{ width: 70 }} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Building your plan..." : "Generate Study Schedule"}
          </button>
          {schedule?.based_on_weak_topics?.length > 0 && (
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              This will prioritize topics you struggled with in past quizzes.
            </p>
          )}
        </div>
      </div>
    );
  }

  const day = schedule.days[activeDay];

  return (
    <div>
      <div className="day-tab-row">
        {schedule.days.map((d, i) => (
          <button key={i} className={`day-tab ${activeDay === i ? "active" : ""}`} onClick={() => setActiveDay(i)}>
            {d.date_label || `Day ${d.day}`}
          </button>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Focus Topics</h3>
        <p>{(day.focus_topics || []).join(", ")}</p>

        <h3 style={{ fontFamily: "var(--font-display)" }}>Tasks</h3>
        {(day.tasks || []).map((t, i) => (
          <div key={i} className="task-row">
            <div className="task-time">{t.time_slot}</div>
            <div>
              <strong>{t.task}</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase" }}>{t.type}</div>
            </div>
          </div>
        ))}

        {day.study_tip && (
          <div style={{ marginTop: 16, padding: 14, background: "#FFF7E8", borderRadius: 8, fontSize: "0.9rem" }}>
            💡 {day.study_tip}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Regenerating..." : "Regenerate Schedule"}
        </button>
      </div>
    </div>
  );
}
