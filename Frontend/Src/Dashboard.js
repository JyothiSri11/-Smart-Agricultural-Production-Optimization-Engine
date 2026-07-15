import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../api/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [materials, setMaterials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.listMaterials(), api.getAnalytics()])
      .then(([m, a]) => {
        setMaterials(m);
        setAnalytics(a);
      })
      .catch(() => setError("Could not reach the StudyAI backend. Is Flask running on port 5000?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div>
      <h1 className="page-title">Your Study Dashboard</h1>
      <p className="page-subtitle">Everything you've uploaded, quizzed on, and scheduled — in one place.</p>

      {error && <div className="error-banner">{error}</div>}

      {analytics && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{analytics.total_materials}</div>
            <div className="stat-label">Materials</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.total_attempts}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.average_score}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.weakest_topics.length}</div>
            <div className="stat-label">Weak Topics</div>
          </div>
        </div>
      )}

      {analytics && analytics.score_trend.length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Score Trend</h3>
          <Line
            data={{
              labels: analytics.score_trend.map((s, i) => `Attempt ${i + 1}`),
              datasets: [
                {
                  label: "Quiz Score %",
                  data: analytics.score_trend.map((s) => s.score_pct),
                  borderColor: "#F2A93B",
                  backgroundColor: "#F2A93B",
                  tension: 0.3,
                },
              ],
            }}
            options={{ scales: { y: { min: 0, max: 100 } } }}
          />
        </div>
      )}

      {analytics && analytics.topic_breakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Accuracy by Topic</h3>
          <Bar
            data={{
              labels: analytics.topic_breakdown.map((t) => t.topic),
              datasets: [
                {
                  label: "Accuracy %",
                  data: analytics.topic_breakdown.map((t) => t.accuracy),
                  backgroundColor: "#16213E",
                },
              ],
            }}
            options={{ scales: { y: { min: 0, max: 100 } } }}
          />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", margin: 0 }}>Your Materials</h2>
        <Link to="/upload" className="btn btn-primary">+ Upload New</Link>
      </div>

      {materials.length === 0 ? (
        <div className="empty-state card">
          No study material yet. <Link to="/upload">Upload your first PDF, DOCX, or notes</Link> to get started.
        </div>
      ) : (
        <div className="material-grid">
          {materials.map((m) => (
            <Link to={`/material/${m.id}`} key={m.id} className="material-card">
              <h3>{m.title}</h3>
              <p>{m.char_count.toLocaleString()} characters</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
