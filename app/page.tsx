"use client";
import { useState } from "react";

export default function Home() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<any>(null);

  async function checkZip() {
    const res = await fetch(`/api/lookup?zip=${zip}`);
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="container">
      <h1>ZIP Coverage Checker</h1>
      <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Enter ZIP" />
      <button onClick={checkZip}>Check</button>

      {result && (
        <div>
          {result.covered ? (
            <>
              <h2>YES</h2>
              <p>{result.installers.join(", ")}</p>
            </>
          ) : (
            <h2>NO</h2>
          )}
        </div>
      )}
    </div>
  );
}
