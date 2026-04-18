import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env.js";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

let geminiClient = null;

function debugLog(message, payload) {
  if (payload === undefined) {
    console.log(`[DEBUG] [GeminiService] ${message}`);
    return;
  }
  console.log(`[DEBUG] [GeminiService] ${message}`, payload);
}

function getGeminiClient() {
  if (!ENV.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    debugLog("Initializing Gemini client");
    geminiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }
  return geminiClient;
}

function normalizeModelName(modelName) {
  if (!modelName) return DEFAULT_GEMINI_MODEL;
  return String(modelName).trim();
}

function stripCodeFence(value) {
  const text = String(value || "").trim();
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseGeminiJson(rawText) {
  const cleaned = stripCodeFence(rawText);

  try {
    return JSON.parse(cleaned);
  } catch {
    const matched = cleaned.match(/\{[\s\S]*\}/);
    if (!matched) return null;

    try {
      return JSON.parse(matched[0]);
    } catch {
      return null;
    }
  }
}

function parseTermsFromLooseText(rawText) {
  const cleaned = stripCodeFence(rawText).toLowerCase();
  if (!cleaned) return [];

  const normalized = cleaned.replace(/[^\p{L}\p{N}\s,]+/gu, " ");
  const chunks = normalized
    .split(/[,\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const terms = chunks
    .flatMap((chunk) => chunk.split(/\s{2,}/).map((part) => part.trim()))
    .map((term) => term.replace(/\s+/g, " "))
    .filter((term) => term.length > 1 && term.length <= 24)
    .slice(0, 8);

  return Array.from(new Set(terms));
}

export function isGeminiConfigured() {
  return Boolean(ENV.GEMINI_API_KEY);
}

export async function extractSearchTermsFromGemini({ userQuery, originalTokens = [] }) {
  debugLog("Received search-term extraction request", {
    query: userQuery,
    originalTokens,
  });

  const client = getGeminiClient();
  if (!client) {
    debugLog("Gemini is not configured for term extraction");
    return {
      terms: [],
      isFromGemini: false,
      debugReason: "missing_api_key",
    };
  }

  const prompt = `
Convert a user shopping query into short product search terms.

Rules:
1) Return only strict JSON object.
2) JSON shape:
{
  "terms": ["term1", "term2", "..."]
}
3) Terms must be in english and useful for product catalog search.
4) Use 1-2 words per term.
5) Return up to 8 terms.
6) Do not include punctuation.

User query:
${userQuery}

Known query tokens:
${JSON.stringify(originalTokens)}
  `.trim();

  debugLog("Sending term extraction prompt to Gemini", {
    model: normalizeModelName(ENV.GEMINI_MODEL),
    promptPreview: prompt.slice(0, 500),
  });

  const response = await client.models.generateContent({
    model: normalizeModelName(ENV.GEMINI_MODEL),
    contents: prompt,
    config: {
      temperature: 0,
      maxOutputTokens: 180,
      responseMimeType: "application/json",
    },
  });

  const rawText = typeof response.text === "function" ? response.text() : response.text;
  debugLog("Raw term extraction response received from Gemini", { rawText });
  const parsed = parseGeminiJson(rawText);

  if (!parsed) {
    const fallbackTerms = parseTermsFromLooseText(rawText);
    debugLog("Failed to parse term extraction response", { fallbackTerms });
    return {
      terms: fallbackTerms,
      isFromGemini: fallbackTerms.length > 0,
      debugReason: fallbackTerms.length > 0 ? "loose_text_fallback" : "invalid_json",
    };
  }

  const terms = Array.isArray(parsed?.terms)
    ? parsed.terms
        .map((term) => String(term || "").toLowerCase().trim())
        .filter((term) => term.length > 1 && term.length <= 24)
        .slice(0, 8)
    : [];

  debugLog("Parsed term extraction response", { terms });

  return {
    terms: Array.from(new Set(terms)),
    isFromGemini: true,
    debugReason: "ok",
  };
}

export async function getProductRecommendationsFromGemini({ userQuery, products }) {
  debugLog("Received recommendation request", {
    query: userQuery,
    productsCount: Array.isArray(products) ? products.length : 0,
  });

  const client = getGeminiClient();
  if (!client) {
    debugLog("Gemini is not configured - missing API key");
    return {
      assistantMessage: "",
      productIds: [],
      isFromGemini: false,
      debugReason: "missing_api_key",
    };
  }

  const prompt = `
You are a shopping assistant for an e-commerce app.
Choose the most relevant products for the user request.

Rules:
1) Return only strict JSON object.
2) JSON shape:
{
  "assistantMessage": "natural short response in russian (1-2 sentences, friendly, varied wording)",
  "productIds": ["<productId1>", "<productId2>", "..."]
}
3) Use only product IDs that exist in the list.
4) Return up to 6 IDs, no duplicates.
5) If nothing relevant exists, return:
{
  "assistantMessage": "По вашему запросу подходящих товаров не найдено.",
  "productIds": []
}

User request:
${userQuery}

Products:
${JSON.stringify(products)}
  `.trim();

  debugLog("Sending prompt to Gemini", {
    model: normalizeModelName(ENV.GEMINI_MODEL),
    promptPreview: prompt.slice(0, 700),
  });

  const response = await client.models.generateContent({
    model: normalizeModelName(ENV.GEMINI_MODEL),
    contents: prompt,
    config: {
      temperature: 0.45,
      maxOutputTokens: 220,
      responseMimeType: "application/json",
    },
  });

  const rawText = typeof response.text === "function" ? response.text() : response.text;
  debugLog("Raw response received from Gemini", { rawText });
  const parsed = parseGeminiJson(rawText);
  if (!parsed) {
    debugLog("Failed to parse Gemini response as JSON");
    return {
      assistantMessage: "",
      productIds: [],
      isFromGemini: false,
      debugReason: "invalid_json",
    };
  }

  const productIds = Array.isArray(parsed?.productIds)
    ? parsed.productIds.map((id) => String(id))
    : [];

  debugLog("Parsed Gemini response", {
    assistantMessage: parsed?.assistantMessage || "",
    productIds,
  });

  return {
    assistantMessage:
      typeof parsed?.assistantMessage === "string" && parsed.assistantMessage.trim()
        ? parsed.assistantMessage.trim()
        : "",
    productIds: Array.from(new Set(productIds)).slice(0, 6),
    isFromGemini: true,
    debugReason: "ok",
  };
}
