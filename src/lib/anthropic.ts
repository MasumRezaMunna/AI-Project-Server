/**
 * Thin wrapper around the Anthropic Messages API.
 * Used by both AI features: the Trip Concierge recommender and the
 * Highlight Generator. Requires ANTHROPIC_API_KEY to be set in .env.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicMessageResponse {
  content: Array<AnthropicTextBlock | { type: string; [key: string]: unknown }>;
}

export class AnthropicConfigError extends Error {}

export async function callClaude(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    throw new AnthropicConfigError(
      "ANTHROPIC_API_KEY is not set. Add a valid key to server/.env to enable AI features."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 700,
      system: params.system,
      messages: [{ role: "user", content: params.userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const textBlock = data.content.find(
    (block): block is AnthropicTextBlock => block.type === "text"
  );

  if (!textBlock) {
    throw new Error("Anthropic API returned no text content.");
  }

  return textBlock.text.trim();
}

/** Strips ```json fences and parses a JSON response from Claude. */
export function parseJsonFromClaude<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
  return JSON.parse(cleaned) as T;
}
