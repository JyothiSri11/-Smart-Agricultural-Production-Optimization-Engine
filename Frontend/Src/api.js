import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({ baseURL: API_BASE });

export const api = {
  // Materials
  uploadMaterial: (formData) =>
    client.post("/materials/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  listMaterials: () => client.get("/materials").then((r) => r.data),
  getMaterial: (id) => client.get(`/materials/${id}`).then((r) => r.data),
  deleteMaterial: (id) => client.delete(`/materials/${id}`).then((r) => r.data),

  // Summary
  generateSummary: (id) => client.post(`/materials/${id}/summary`).then((r) => r.data),

  // Flashcards
  generateFlashcards: (id, count) =>
    client.post(`/materials/${id}/flashcards`, { count }).then((r) => r.data),
  getFlashcardDeck: (deckId) => client.get(`/flashcards/${deckId}`).then((r) => r.data),

  // Quiz
  generateQuiz: (id, quizType, numQuestions) =>
    client.post(`/materials/${id}/quiz`, { quiz_type: quizType, num_questions: numQuestions }).then((r) => r.data),
  getQuiz: (quizId) => client.get(`/quizzes/${quizId}`).then((r) => r.data),
  submitQuiz: (quizId, answers) =>
    client.post(`/quizzes/${quizId}/submit`, { answers }).then((r) => r.data),

  // Schedule
  generateSchedule: (id, days) =>
    client.post(`/materials/${id}/schedule`, { days }).then((r) => r.data),
  getSchedule: (scheduleId) => client.get(`/schedules/${scheduleId}`).then((r) => r.data),

  // Analytics
  getAnalytics: () => client.get("/analytics").then((r) => r.data),
};

export default api;
