import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const flashModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const flashLiteModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export type GeminiModelType = "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export function getGeminiModel(model: GeminiModelType) {
  return model === "gemini-2.5-flash-lite" ? flashLiteModel : flashModel;
}
