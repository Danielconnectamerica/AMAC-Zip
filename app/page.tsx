"use client";

import { useEffect, useState } from "react";

type ApiResult = { ok: boolean; msg: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [zip, setZip] = useState("");
  const [installers, setInstallers] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load/save token for convenience (this browser only)
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("admin_token", token);
  }, [token]);

  function installersArray(): string[] {
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
          msg: data?.details
            ? `${data?.error || "Error"}: ${data.details}`
            : data?.error || `Error ${res.status}`
        });
        return;
      }

      setResult({ ok: true, msg: "Success ✅ (Committed to GitHub)" });
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  async function onAddMerge() {
    const arr = installersArray();
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP (5 digits or ZIP+4)" });
    if (arr.length === 0) return setResult({ ok: false, msg: "Enter installer(s)" });

    await callAdmin("/api/admin/add", { zip, installers: arr });
  }

  async function onUpdateReplace() {
    const arr = installersArray();
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP (5 digits or ZIP+4)" });
    if (arr.length === 0) return setResult({ ok: false, msg: "Enter installer(s)" });

    await callAdmin("/api/admin/update", { zip, installers: arr });
  }

  async function onRemove() {
    if (!zip.trim()) return setResult({ ok: false, msg: "Enter a ZIP (5 digits or ZIP+4)" });

    const ok = confirm(`Remove ZIP ${zip}? This deletes it from coverage.`);
    if (!ok) return;

    await callAdmin("/api/admin/remove", { zip });
  }

  async function downloadCsv() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/export", {
        method: "GET",
        headers: { "x-admin-token": token }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResult({
          ok: false,
          msg: data?.details
            ? `${data?.error || "Export failed"}: ${data.details}`
            : data?.error || `Export failed (${res.status})`
        });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "zip-installers.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setResult({ ok: true, msg: "CSV downloaded ✅" });
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Export failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Admin — AMAC ZIP Coverage</h1>

      <p style={{ marginTop: 6, color: "#444" }}>
        Token is set in Vercel env var <code>ADMIN_TOKEN</code>. (You chose: <b>amac123</b>)
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

      {/* ✅ Buttons live right here */}
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

        <button onClick={downloadCsv} disabled={loading}>
          Download CSV
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
        </div>
      )}

      <hr style={{ margin: "18px 0" }} />

      <h3>Button behavior</h3>
      <ul style={{ color: "#444" }}>
        <li><b>Add / Merge</b>: Adds installer(s) to the ZIP without removing existing ones.</li>
        <li><b>Update / Replace</b>: Overwrites the ZIP’s installer list.</li>
        <li><b>Remove ZIP</b>: Deletes the ZIP from the coverage list.</li>
        <li><b>Download CSV</b>: Exports all ZIPs + installers for checking in Excel.</li>
      </ul>
    </div>
  );
}
