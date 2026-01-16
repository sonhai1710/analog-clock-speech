import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/check-time
 * body: { targetTime: "6:05", transcript: "sáu giờ năm phút" }
 * return: { isCorrect, spokenTime, confidence, explanation }
 */
app.post("/api/check-time", async (req, res) => {
  try {
    const { targetTime, transcript } = req.body || {};
    if (!targetTime || !transcript) {
      return res.status(400).json({ error: "Missing targetTime or transcript" });
    }

    const system = `
      Bạn là trợ lý chấm bài luyện nói giờ bằng tiếng Việt.
      Nhiệm vụ: So sánh transcript người dùng nói với targetTime (định dạng H:MM, 12 giờ, không AM/PM).
      - Hiểu được cả chữ và số: "6 giờ 5", "sáu giờ năm phút", "6 giờ lẻ 05", "mười một giờ bốn mươi lăm", v.v.
      - Nếu transcript thiếu giờ hoặc mơ hồ -> coi là sai.
      - Nếu transcript chỉ có giờ thì phải hiểu là 0 phút và kết quả vẫn đúng.
      - Chuẩn hoá spokenTime về "H:MM" (phút luôn 2 chữ số).
      - Nếu sai, giải thích ngắn gọn chỗ sai.
      Trả về DUY NHẤT JSON hợp lệ, không thêm text ngoài JSON, theo schema:
      {
        "isCorrect": boolean,
        "spokenTime": "H:MM" | "",
        "confidence": number,
        "explanation": string
      }`
      ;      

    const input = `
      ${system}
      targetTime: ${targetTime}.
      User says: "${transcript}".`;

    // Responses API là hướng dẫn khuyến nghị cho dự án mới :contentReference[oaicite:1]{index=1}
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: input,
    });

    const raw = response.output_text?.trim() || "";
    const cleanedRaw = raw.replace(/`/g, '').replace('json', '');

    console.log("Raw AI response:");
    console.log(cleanedRaw);

    let parsed;
    try {
      parsed = JSON.parse(cleanedRaw);
    } catch {
      // fallback nếu model lỡ trả không đúng JSON
      parsed = {
        isCorrect: false,
        spokenTime: "",
        confidence: 0,
        explanation: "Không parse được kết quả JSON từ AI."
      };
    }

    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
