"use client";

import { useEffect, useState } from "react";

type ApiResult = { ok: boolean; msg: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [zip, setZip] = useState("");
  const [installers, setInstallers] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Optional: remember token in this browser
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("admin_token", token);
  }, [token]);

  function installersArray() {
    return installers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function callAdmin(endpoint: string, body: any) {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResult({
          ok: false,
          msg: data?.error || data?.details || `Error ${res.status}`
        });
      } else {
        setResult({ ok: true, msg: "Success ✅ (Committed to GitHub)" });
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  async function onAddMerge() {
    const arr = installersArray();
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP" });
    if (arr.length === 0) return setResult({ ok: false, msg: "Enter installer(s)" });

    await callAdmin("/api/admin/add", { zip, installers: arr });
  }

  async function onUpdateReplace() {
    const arr = installersArray();
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP" });
    if (arr.length === 0) return setResult({ ok: false, msg: "Enter installer(s)" });

    await callAdmin("/api/admin/update", { zip, installers: arr });
  }

  async function onRemove() {
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP" });

    const confirmMsg = `Remove ZIP ${zip}? This deletes it from coverage.`;
    if (!confirm(confirmMsg)) return;

    await callAdmin("/api/admin/remove", { zip });
  }

  return (
    <div className="container">
      <h1>Admin — AMAC ZIP Coverage</h1>
      <p style={{ marginTop: 6, color: "#444" }}>
        Token: <b>amac123</b> (set in Vercel env var <code>ADMIN_TOKEN</code>)
      </p>

      <label style={{ display: "block", marginTop: 18 }}>Admin Token</label>
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="amac123"
        autoComplete="off"
      />

      <label style={{ display: "block", marginTop: 12 }}>ZIP (5 digits or ZIP+4)</label>
      <input
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        placeholder="e.g. 60001 or 60001-1234"
        autoComplete="off"
      />

      <label style={{ display: "block", marginTop: 12 }}>
        Installer(s) (comma separated)
      </label>
      <input
        value={installers}
        onChange={(e) => setInstallers(e.target.value)}
        placeholder="e.g. Lincoln, Darrell"
        autoComplete="off"
      />

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={onAddMerge} disabled={loading}>
          Add / Merge
        </button>

        <button onClick={onUpdateReplace} disabled={loading}>
          Update / Replace
        </button>

        <button onClick={onRemove} disabled={loading}>
          Remove ZIP
        </button>
      </div>

      {loading && <p style={{ marginTop: 12 }}>Working…</p>}

      {result && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8
          }}
        >
          <b style={{ color: result.ok ? "green" : "crimson" }}>
            {result.ok ? "OK" : "Error"}
          </b>
          <div style={{ marginTop: 6 }}>{result.msg}</div>
          {result.ok && (
            <div style={{ marginTop: 6, color: "#555" }}>
              Tip: check GitHub commits + Vercel deployments to confirm the redeploy.
            </div>
          )}
        </div>
      )}

      <hr style={{ margin: "18px 0" }} />

      <h3>How buttons work</h3>
      <ul style={{ color: "#444" }}>
        <li><b>Add / Merge</b> = adds installers to the ZIP without removing existing ones.</li>
        <li><b>Update / Replace</b> = overwrites the ZIP’s installer list.</li>
        <li><b>Remove ZIP</b> = deletes the ZIP completely.</li>
      </ul>
    </div>
  );
}
