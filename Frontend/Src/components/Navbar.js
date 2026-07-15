import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="dot" />
        StudyAI
      </Link>
      <nav className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/upload">Upload Material</Link>
      </nav>
    </header>
  );
}
