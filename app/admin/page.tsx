"use client";
import { useState } from "react";

export default function Admin() {
  const [token, setToken] = useState("");
  const [zip, setZip] = useState("");
  const [installer, setInstaller] = useState("");

  async function add() {
    await fetch("/api/admin/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({
        zip,
        installers: installer.split(",").map((i) => i.trim())
      })
    });
    alert("Updated!");
  }

  return (
    <div className="container">
      <h1>Admin</h1>
      <input placeholder="Admin Token" value={token} onChange={(e) => setToken(e.target.value)} />
      <input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
      <input placeholder="Installers (comma separated)" value={installer} onChange={(e) => setInstaller(e.target.value)} />
      <button onClick={add}>Add / Merge ZIP</button>
    </div>
  );
}
