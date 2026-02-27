"use client";

import { useMemo, useState } from "react";

export default function HomePage() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedHint = useMemo(() => {
    const t = zip.trim();
    if (!t) return "";
    // Show a friendly hint (client-side only)
    const five = t.split("-")[0];
    if (/^\d{5}$/.test(five)) return `Checking ${five}…`;
    return "Enter a 5-digit ZIP (ZIP+4 accepted)";
  }, [zip]);

  async function onCheck() {
    setError(null);
    setResult(null);

    const z = zip.trim();
    if (!z) {
      setError("Please enter a ZIP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lookup?zip=${encodeURIComponent(z)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || `Lookup failed (${res.status})`);
        return;
      }

      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onCheck();
  }

  return (
    <main className="page">
      <div className="card">
        <div className="brandRow">
          <div className="badge">Connect AMAC</div>
          <div className="muted">ZIP Coverage Checker</div>
        </div>

        <h1 className="title">Check Installation Coverage</h1>
        <p className="subtitle">
          Enter your 5-digit ZIP code (ZIP+4 works too). We’ll tell you if the area is covered and who the installer is.
        </p>

        <div className="formRow">
          <input
            className="input"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g., 60001 or 60001-1234"
            inputMode="numeric"
            autoComplete="postal-code"
          />
          <button className="button" onClick={onCheck} disabled={loading}>
            {loading ? "Checking…" : "Check"}
          </button>
        </div>

        {normalizedHint && <div className="hint">{normalizedHint}</div>}

        {error && (
          <div className="alert error">
            <b>Error:</b> {error}
          </div>
        )}

        {result && (
          <div className={`result ${result.covered ? "yes" : "no"}`}>
            <div className="resultTop">
              <div className="resultBig">{result.covered ? "YES" : "NO"}</div>
              <div className="resultSmall">
                {result.covered
                  ? "This ZIP is covered."
                  : "This ZIP is not currently covered."}
              </div>
            </div>

            {result.covered && Array.isArray(result.installers) && (
              <div className="installers">
                <div className="label">Installer(s)</div>
                <div className="pillRow">
                  {result.installers.map((name: string) => (
                    <span key={name} className="pill">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="footerNote">
          Internal admin? Go to <code>/admin</code>.
        </div>
      </div>
    </main>
  );
}
