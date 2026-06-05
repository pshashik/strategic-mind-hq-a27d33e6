import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTION = `You are StrategicMind AI, a geopolitical intelligence analyst. Respond like an official intelligence briefing:
- Use clean markdown: **bold** for key terms, bullet lists for findings, numbered lists for sequences.
- Be concise, analytical, and evidence-driven.
- Structure: brief executive line, then key points, then implications.
- Avoid speculation unless explicitly asked for scenarios.`;

const MessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  history: z.array(MessageSchema).max(40),
  question: z.string().min(1).max(4000),
});

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { text: "", error: "GEMINI_API_KEY is not configured on the server." };
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const contents = [
        ...data.history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user" as const, parts: [{ text: data.question }] },
      ];

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      const text = res.text ?? "";
      return { text, error: text ? null : "No response received." };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      console.error("askGemini error:", msg);
      return { text: "", error: msg };
    }
  });
