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
const [creatorName, setCreatorName] = useState("");

  const [submitStatus, setSubmitStatus] = useState(null);
  const [scale, setScale] = useState(1);
  const [wordCount, setWordCount] = useState(7);

  useEffect(() => {
    const calcScale = () => {
      const w = window.innerWidth;
      if (w < 820) { setScale(1); return; }
      setScale(Math.min(2, Math.max(1, w / 1200)));
    };
    calcScale();
    window.addEventListener("resize", calcScale);
    return () => window.removeEventListener("resize", calcScale);
  }, []);

  const s = (n) => Math.round(n * scale);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      const timeoutId = window.setTimeout(() => setStatus("invalid"), 0);
      return () => window.clearTimeout(timeoutId);
    }
    const sessionId = localStorage.getItem(`kzw_session_${token}`);
    if (!sessionId) {
      const timeoutId = window.setTimeout(() => setStatus("invalid"), 0);
      return () => window.clearTimeout(timeoutId);
    }
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
          const wc = parseInt(params.get("words") || "7", 10);
          if (Number.isFinite(wc) && wc > 0) setWordCount(wc);
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

if (!theme.trim() || !words.trim() || !notifyMethod || !username.trim() || !creatorName.trim()) {

      alert("Please fill in all fields.");
      return;
    }


const wordList = words.trim().replace(/[.,]+$/, "").split(",").map((w) => w.trim().replace(/[.,]+$/, "").toUpperCase()).filter((w) => w.length > 0);
    if (wordList.length !== wordCount || wordList.some((w) => w.length !== 5)) {
      alert(`Please enter exactly ${wordCount} words, each exactly 5 letters, separated by commas.`);
      return;
    }


    setSubmitStatus("submitting");
    const res = await fetch("/api/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },

	body: JSON.stringify({ token, sessionId, theme, words: wordList, notifyMethod, username, creatorName }),

    });
    const d = await res.json();

	if (d.success) {
      localStorage.setItem(`kzw_submitted_at`, String(Date.now()));
      setSubmitStatus("done");


    } else if (d.reason === "used") {
      setStatus("used");
    } else {
      setSubmitStatus("error");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: `${s(10)}px ${s(12)}px`,
    borderRadius: s(8),
    border: `${s(1.5)}px solid #d1d5db`,
    fontSize: s(14),
    outline: "none",
    boxSizing: "border-box",
    color: "#111827",
  };

  const placeholderStyle = `

	input::placeholder, textarea::placeholder { color: #6b7280 !important; opacity: 1 !important; }
  input::-webkit-input-placeholder, textarea::-webkit-input-placeholder { color: #6b7280 !important; opacity: 1 !important; }
  input::-moz-placeholder, textarea::-moz-placeholder { color: #6b7280 !important; opacity: 1 !important; }


  `;

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ fontSize: s(18), fontWeight: 700, color: "#111827" }}>Checking your reward...</div>
    </div>
  );

  if (status === "invalid") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ textAlign: "center", padding: s(32) }}>
        <div style={{ fontSize: s(40), marginBottom: s(16) }}>🔒</div>
        <div style={{ fontSize: s(20), fontWeight: 900, color: "#111827", marginBottom: s(8) }}>Invalid Link</div>
        <div style={{ fontSize: s(14), color: "#6b7280" }}>This reward link is invalid or has expired. You can only access this through your game after solving the Kazword.</div>
      </div>
    </div>
  );

  if (status === "used") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>
      <div style={{ textAlign: "center", padding: s(32) }}>
        <div style={{ fontSize: s(40), marginBottom: s(16) }}>✅</div>
        <div style={{ fontSize: s(20), fontWeight: 900, color: "#111827", marginBottom: s(8) }}>Already Submitted</div>
        <div style={{ fontSize: s(14), color: "#6b7280" }}>You already submitted your puzzle suggestion today. Come back tomorrow after solving the next Kazword to submit another!</div>
      </div>
    </div>
  );

  if (submitStatus === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f8" }}>


	  <div style={{ textAlign: "center", padding: s(32), maxWidth: s(400) }}>
        <div style={{ marginBottom: s(16), display: "flex", justifyContent: "center" }}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={s(48)} height={s(48)}>
    <rect x="35" y="3" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="3" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="35" y="35" width="30" height="30" rx="5" fill="#F5C842" stroke="#000000" strokeWidth="4"/>
    <rect x="67" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="35" y="67" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
  </svg>
</div>
        <div style={{ fontSize: s(20), fontWeight: 900, color: "#111827", marginBottom: s(8) }}>Thank You!</div>
        <div style={{ fontSize: s(14), color: "#111827", lineHeight: 1.6 }}>Your puzzle suggestion has been submitted. If your puzzle gets chosen, you&apos;ll be notified on the platform you selected with the date that it&apos;ll be featured!</div>




      </div>
    </div>
  );

  return (
    <>
      <style>{placeholderStyle}</style>
      <div style={{ minHeight: "100vh", background: "#f6f7f8", display: "flex", alignItems: "center", justifyContent: "center", padding: s(16) }}>
        <div style={{ background: "white", borderRadius: s(16), padding: s(32), maxWidth: s(480), width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: s(24) }}>
            <div style={{ marginBottom: s(8), display: "flex", justifyContent: "center" }}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={s(47)} height={s(47)}>
    <rect x="35" y="3" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="3" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="35" y="35" width="30" height="30" rx="5" fill="#F5C842" stroke="#000000" strokeWidth="4"/>
    <rect x="67" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
    <rect x="35" y="67" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/>
  </svg>
</div>
            <div style={{ fontSize: s(22), fontWeight: 900, color: "#111827", marginBottom: s(4) }}>Submit Your Very Own Kazword!!</div>
            <div style={{ fontSize: s(13), color: "#6b7280" }}>You solved Kazword #{puzzleNumber} in {submissions} attempts — submit your puzzle idea for a chance to get it featured!</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: s(16) }}>

			<div>
              <label style={{ fontSize: s(13), fontWeight: 700, color: "#374151", display: "block", marginBottom: s(4) }}>1. Your name:</label>
              <div style={{ fontSize: s(11), color: "#6b7280", marginBottom: s(6) }}>This is how you&apos;ll be credited if your puzzle gets featured. Last name is optional.</div>
              <input
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Zain or Zain Kazmi"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: s(13), fontWeight: 700, color: "#374151", display: "block", marginBottom: s(6) }}>2. Type your theme:</label>

              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Animals, Ocean, Things you wear"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: s(13), fontWeight: 700, color: "#374151", display: "block", marginBottom: s(6) }}>3. List {wordCount} words that go with your theme (exactly 5 letters each, comma separated):</label>
              <textarea
                value={words}
                onChange={(e) => setWords(e.target.value)}
                placeholder="e.g. HYENA, SNAKE, HORSE, SNAIL, TIGER, WHALE, SHEEP"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ fontSize: s(13), fontWeight: 700, color: "#374151", display: "block", marginBottom: s(6) }}>4. How would you prefer to be notified if your puzzle gets chosen?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
                {["Instagram", "Twitter / X", "Discord", "TikTok", "Email"].map((opt) => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: s(8), cursor: "pointer", fontSize: s(14), color: "#374151" }}>
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
              <label style={{ fontSize: s(13), fontWeight: 700, color: "#374151", display: "block", marginBottom: s(6) }}>5. Enter your {notifyMethod || "username"} so you can be notified:</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={notifyMethod ? `Your ${notifyMethod} username` : "Select a method above first"}
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitStatus === "submitting"}
              style={{
                background: submitStatus === "submitting" ? "#9ca3af" : "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "white",
                fontWeight: 900,
                fontSize: s(15),
                border: "none",
                borderRadius: s(10),
                padding: `${s(12)}px ${s(24)}px`,
                cursor: submitStatus === "submitting" ? "not-allowed" : "pointer",
                marginTop: s(8),
              }}
            >
              {submitStatus === "submitting" ? "Submitting..." : "Submit My Puzzle Idea ✨"}
            </button>

            {submitStatus === "error" && (
              <div style={{ fontSize: s(13), color: "#ef4444", textAlign: "center" }}>Something went wrong. Please try again.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
