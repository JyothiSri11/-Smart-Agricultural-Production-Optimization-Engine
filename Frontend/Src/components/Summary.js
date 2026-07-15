import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import api from "../api/api";

export default function Summary({ material }) {
  const [summary, setSummary] = useState(material.summary_markdown || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.generateSummary(material.id);
      setSummary(result.summary_markdown);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not generate summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {error && <div className="error-banner">{error}</div>}
      {!summary && !loading && (
        <div className="empty-state">
          <p>No summary yet.</p>
          <button className="btn btn-primary" onClick={handleGenerate}>Generate Summary</button>
        </div>
      )}
      {loading && <div className="loading">Reading your material and writing a summary...</div>}
      {summary && !loading && (
        <div>
          <div className="markdown-body">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
          <button className="btn btn-secondary" onClick={handleGenerate} style={{ marginTop: 16 }}>
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
