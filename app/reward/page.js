"use client";
import { useEffect, useState } from "react";

export default function RewardPage() {
  const [status, setStatus] = useState("loading");
  const [submissions, setSubmissions] = useState(null);
  const [puzzleNumber, setPuzzleNumber] = useState(null);
  const [theme, setTheme] = useState("");
  const [words, setWords] = useState("");
  const [notifyMethod, setNotifyMethod] = useState("");
  const [username, setUsername] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setStatus("invalid"); return; }
    const sessionId = localStorage.getItem(`kzw_session_${token}`);
    if (!sessionId) { setStatus("invalid"); return; }
    fetch("/api/validate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, sessionId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setStatus("valid");
          setSubmissions(d.submissions);
          setPuzzleNumber(d.puzzleNumber);
        } else if (d.reason === "used") {
          setStatus("used");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, []);

  const handleSubmit = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const sessionId = localStorage.getItem(`kzw_session_${token}`);
    if (!theme.trim() || !words.trim() || !notifyMethod || !username.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    const wordList = words.split(",").map((w) => w.trim().toUpperCase());
    if (wordList.length !== 7 || wordList.some((w) => w.length !== 5)) {
      alert("Please enter exactly 7 words, each exactly 5 letters, separated by commas.");
      return;
    }
    setSubmitStatus("submitting");
    const res = await fetch("/api/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, sessionId, theme, words: wordList, notifyMethod, username }),
    });
    const d = await res.json();
    if (d.success) {
      setSubmitStatus("done");
    } else if (d.reason === "used") {
      setStatus("used");
    } else {
      setSubmitStatus("error");
    }
  };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Checking your reward...</div>
    </div>
  );

  if (status === "invalid") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Invalid Link</div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>This reward link is invalid or has expired. You can only access this through your game after solving in under 20 attempts.</div>
      </div>
    </div>
  );

  if (status === "used") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Already Submitted</div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>You already submitted your puzzle suggestion for today. Come back tomorrow after solving in under 20 attempts!</div>
      </div>
    </div>
  );

  if (submitStatus === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌟</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Thank You!</div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>Your puzzle suggestion has been submitted. We'll notify you if it gets chosen!</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Top Solver Reward</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Kazword #{puzzleNumber} — Solved in {submissions} attempts</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Type your theme:</label>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Ocean, Space, Halloween..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. List 7 words that go with your theme (exactly 5 letters each, comma separated):</label>
            <textarea
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="e.g. CORAL, SHARK, WAVES, SHELL, OCEAN, ALGAE, BRINE"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. How would you prefer to be notified if your puzzle gets chosen?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Instagram", "Twitter / X", "Discord", "Email"].map((opt) => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#374151" }}>
                  <input
                    type="radio"
                    name="notifyMethod"
                    value={opt}
                    checked={notifyMethod === opt}
                    onChange={(e) => setNotifyMethod(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>4. Enter your {notifyMethod || "username"} so we can notify you:</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={notifyMethod ? `Your ${notifyMethod} username` : "Select a method above first"}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitStatus === "submitting"}
            style={{
              background: submitStatus === "submitting" ? "#9ca3af" : "linear-gradient(135deg, #f59e0b, #ef4444)",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              cursor: submitStatus === "submitting" ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {submitStatus === "submitting" ? "Submitting..." : "Submit My Puzzle Idea ✨"}
          </button>

          {submitStatus === "error" && (
            <div style={{ fontSize: 13, color: "#ef4444", textAlign: "center" }}>Something went wrong. Please try again.</div>
          )}
        </div>
      </div>
    </div>
  );
}