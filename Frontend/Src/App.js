import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import MaterialWorkspace from "./components/MaterialWorkspace";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/material/:id" element={<MaterialWorkspace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
