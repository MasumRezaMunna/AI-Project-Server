import { Router, Request, Response } from "express";
import experiencesData from "../data/experiences.json";
import { Experience, AIRecommendResponseBody, AIHighlightResponseBody } from "../types";
import { callAI, parseJsonFromAI, AIConfigError } from "../lib/llm";

const router = Router();
const experiences = experiencesData as Experience[];

/**
 * AI Feature 1: Trip Concierge
 * Takes a free-text description of what the traveller wants and asks the
 * model to pick the best-matching experiences from the real catalog, with reasons.
 */
router.post("/recommend", async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "A 'prompt' string is required." });
  }

  // Compact catalog summary so the model has just enough to reason over.
  const catalogSummary = experiences.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    location: e.location,
    country: e.country,
    price: e.price,
    rating: e.rating,
    durationDays: e.durationDays,
    difficulty: e.difficulty,
    tags: e.tags,
    shortDescription: e.shortDescription,
  }));

  const system = `You are the Trip Concierge for Wanderlust Trails, a curated travel experience marketplace.
You will be given a traveller's request and a JSON catalog of available experiences.
Pick the 3 best-matching experiences for the request and explain briefly why each fits.
Respond with ONLY valid JSON, no markdown fences, no preamble, matching this exact shape:
{"summary": "one short sentence summarizing what you understood the traveller wants", "recommendations": [{"id": "experience-id-from-catalog", "reason": "one or two sentences on why this fits, referencing specifics from their request"}]}
Only use "id" values that exist in the provided catalog. Always return exactly 3 recommendations unless fewer than 3 experiences are plausible matches, in which case return as many good matches as you can justify.`;

  const userMessage = `Traveller request: "${prompt.trim()}"

Catalog:
${JSON.stringify(catalogSummary)}`;

  try {
    const raw = await callAI({ system, userMessage, maxTokens: 600 });
    const parsed = parseJsonFromAI<AIRecommendResponseBody>(raw);

    // Validate returned ids actually exist, drop any hallucinated ones.
    const validIds = new Set(experiences.map((e) => e.id));
    parsed.recommendations = (parsed.recommendations || []).filter((r) =>
      validIds.has(r.id)
    );

    res.json(parsed);
  } catch (err) {
    if (err instanceof AIConfigError) {
      return res.status(503).json({ error: err.message });
    }
    console.error("AI recommend error:", err);
    res.status(502).json({ error: "The AI concierge couldn't process that request. Try again." });
  }
});

/**
 * AI Feature 2: Highlight Generator
 * Generates a short, personalized "why you'll love this" blurb for a single
 * experience, optionally tailored to a stated interest.
 */
router.post("/highlight", async (req: Request, res: Response) => {
  const { experienceId, interest } = req.body as {
    experienceId?: string;
    interest?: string;
  };

  if (!experienceId) {
    return res.status(400).json({ error: "An 'experienceId' string is required." });
  }

  const experience = experiences.find((e) => e.id === experienceId);
  if (!experience) {
    return res.status(404).json({ error: "Experience not found." });
  }

  const system = `You are a travel copywriter for Wanderlust Trails. Given details about one travel experience
and optionally a traveller's specific interest, write a single short, vivid paragraph (2-3 sentences max)
explaining why this traveller in particular would love this trip. Be specific and concrete, reference real
details from the experience, and avoid generic travel-brochure language ("unforgettable", "once in a lifetime",
"hidden gem"). Respond with plain text only, no JSON, no markdown, no quotation marks around the output.`;

  const userMessage = `Experience: ${experience.title}
Location: ${experience.location}, ${experience.country}
Category: ${experience.category}
Duration: ${experience.durationDays} day(s)
Difficulty: ${experience.difficulty}
Highlights: ${experience.highlights.join("; ")}
Description: ${experience.description}
${interest && interest.trim() ? `Traveller's stated interest: "${interest.trim()}"` : "Traveller has not specified a particular interest — write a general but specific highlight."}`;

  try {
    const highlight = await callAI({ system, userMessage, maxTokens: 200 });
    const payload: AIHighlightResponseBody = { highlight };
    res.json(payload);
  } catch (err) {
    if (err instanceof AIConfigError) {
      return res.status(503).json({ error: err.message });
    }
    console.error("AI highlight error:", err);
    res.status(502).json({ error: "The AI highlight generator couldn't process that request. Try again." });
  }
});

export default router;
