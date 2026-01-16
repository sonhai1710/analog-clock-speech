import React, { useMemo, useRef, useState } from "react";
import AnalogClock from "./components/AnalogClock";
import "./App.css";

function randomTime5MinStep() {
  const hour = Math.floor(Math.random() * 12) + 1; // 1..12
  const minute = Math.floor(Math.random() * 12) * 5; // 0..55 step 5
  return { hour, minute };
}

function formatTime({ hour, minute }) {
  const mm = String(minute).padStart(2, "0");
  return `${hour}:${mm}`;
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(() => ({ hour: 0, minute: 0 }));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResult, setAiResult] = useState(null); // {isCorrect, spokenTime, confidence, explanation}
  const [rows, setRows] = useState([]); // report table

  const timeRef = useRef(time);
  timeRef.current = time;

  const SpeechRecognition = useMemo(() => getSpeechRecognition(), []);

  const handleStart = () => {
    setStarted(true);
    setRows([]);          // reset report theo yêu cầu
    setAiResult(null);
    setTranscript("");
    const t = randomTime5MinStep();
    setTime(t);
  };

  const runCheckWithAI = async (targetTime, transcriptText) => {
    const res = await fetch("/api/check-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetTime, transcript: transcriptText })
    });
    return res.json();
  };

  const startListeningAndCheck = async (target) => {
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ SpeechRecognition. Hãy dùng Chrome desktop.");
      return;
    }

    setListening(true);
    setTranscript("");
    setAiResult(null);

    const rec = new SpeechRecognition();
    rec.lang = "vi-VN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = async (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(text);

      try {
        const targetTime = formatTime(target);
        const result = await runCheckWithAI(targetTime, text);

        setAiResult(result);

        setRows((prev) => [
          {
            id: crypto.randomUUID(),
            targetTime,
            transcript: text,
            isCorrect: !!result?.isCorrect,
            spokenTime: result?.spokenTime || "",
            confidence: typeof result?.confidence === "number" ? result.confidence : null
          },
          ...prev
        ]);
      } catch (e) {
        console.error(e);
        setAiResult({
          isCorrect: false,
          spokenTime: "",
          confidence: 0,
          explanation: "Lỗi khi gọi AI."
        });
      } finally {
        setListening(false);
      }
    };

    rec.onerror = (e) => {
      console.error(e);
      setListening(false);
      alert("Không lấy được âm thanh từ micro (bị từ chối quyền hoặc lỗi thiết bị).");
    };

    rec.onend = () => {
      // Nếu user im lặng, rec có thể tự end mà chưa có result
      setListening(false);
    };

    rec.start();
  };

  const handleNext = async () => {
    const t = randomTime5MinStep();
    setTime(t);
    await startListeningAndCheck(t);
  };

  return (
    <div className="page">
      <div className="left">
        <h2>Analog Clock Speaking Practice (VI)</h2>

        <>
            <div className="clockWrap">
              <AnalogClock hour={time.hour} minute={time.minute} />
            </div>

            <div className="actions">
              <button className="btn" onClick={handleNext} disabled={listening}>
                {listening ? "Đang nghe..." : "Next"}
              </button>

              <button className="btn secondary" onClick={handleStart} disabled={listening}>
                Restart
              </button>
            </div>

            <div className="status">
              <div><b>Micro:</b> {listening ? "Đang ghi âm / nhận dạng..." : "Idle"}</div>
              <div><b>Transcript:</b> {transcript || "-"}</div>
              <div className="aiBox">
                <b>AI chấm:</b>{" "}
                {aiResult
                  ? (aiResult.isCorrect ? "ĐÚNG" : "SAI")
                  : "-"}
                {aiResult?.explanation ? <div className="hint">{aiResult.explanation}</div> : null}
              </div>
            </div>
          </>
      </div>

      <div className="right">
        <h3>Report</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Time</th>
                <th>Transcript</th>
                <th>AI parsed</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                    (empty)
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td>{r.targetTime}</td>
                    <td>{r.transcript}</td>
                    <td>{r.spokenTime || "-"}</td>
                    <td className={r.isCorrect ? "ok" : "bad"}>
                      {r.isCorrect ? "Correct" : "Wrong"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="note">
          Gợi ý: Nói rõ “giờ” và “phút”, ví dụ: “sáu giờ ba mươi lăm phút”.
        </div>
      </div>
    </div>
  );
}
