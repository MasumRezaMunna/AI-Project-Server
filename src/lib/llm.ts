/**
 * Thin wrapper around the Google Gemini API (generateContent).
 * Used by both AI features: the Trip Concierge recommender and the
 * Highlight Generator. Requires GEMINI_API_KEY to be set in .env.
 *
 * Gemini's free tier (as of writing) requires no credit card and is
 * generous enough for a demo/portfolio project — get a key at
 * https://aistudio.google.com/app/apikey
 */

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

export class AIConfigError extends Error {}

export async function callAI(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new AIConfigError(
      "GEMINI_API_KEY is not set. Add a free key from https://aistudio.google.com/app/apikey to server/.env to enable AI features."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: [{ role: "user", parts: [{ text: params.userMessage }] }],
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 700,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");

  if (!text) {
    throw new Error("Gemini API returned no text content.");
  }

  return text.trim();
}

/** Strips ```json fences and parses a JSON response from the model. */
export function parseJsonFromAI<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
  return JSON.parse(cleaned) as T;
}
