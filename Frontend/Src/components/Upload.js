import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Upload() {
  const [mode, setMode] = useState("file"); // "file" | "text"
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMode("file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "file" && !file) {
      setError("Please choose a PDF, DOCX, or TXT file.");
      return;
    }
    if (mode === "text" && !text.trim()) {
      setError("Please paste some study material text.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      if (mode === "file") {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }
      const material = await api.uploadMaterial(formData);
      navigate(`/material/${material.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed. Check the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Upload Study Material</h1>
      <p className="page-subtitle">PDF, DOCX, or pasted text — StudyAI turns it into summaries, flashcards, quizzes, and a schedule.</p>

      <div className="tab-row">
        <button className={`tab-btn ${mode === "file" ? "active" : ""}`} onClick={() => setMode("file")}>File Upload</button>
        <button className={`tab-btn ${mode === "text" ? "active" : ""}`} onClick={() => setMode("text")}>Paste Text</button>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem" }}>Title (optional)</label>
          <input
            type="text"
            placeholder="e.g. Chapter 4 — Thermodynamics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {mode === "file" ? (
          <div
            className={`dropzone ${dragActive ? "active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {file ? file.name : "Drag & drop a PDF, DOCX, or TXT file, or click to browse"}
            </p>
          </div>
        ) : (
          <textarea
            rows={10}
            placeholder="Paste your notes or textbook content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={submitting}>
          {submitting ? "Uploading..." : "Upload & Continue"}
        </button>
      </form>
    </div>
  );
}
