import axios from "axios";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Temporary Google-side problems (overloaded / rate limited) worth retrying
const RETRYABLE_STATUS = [429, 500, 503, 504];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toError = (err) => {
  // Surface Gemini's own error text (bad key, wrong model name, quota...)
  const apiMsg = err.response?.data?.error?.message;
  return new Error(apiMsg ? `Gemini API: ${apiMsg}` : err.message);
};

const parseResponse = (response) => {
  const candidate = response.data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(
      `Empty response from Gemini (finishReason: ${candidate?.finishReason || "unknown"})`
    );
  }

  // responseMimeType already forces JSON; this is just a safety net
  const clean = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(clean);
};

/**
 * Calls Gemini and returns the parsed JSON object.
 *
 * - Retries once if the model is overloaded (503/429/500/504)
 * - Then falls back to GEMINI_FALLBACK_MODEL
 * - Fails immediately on bad key / bad request (400, 403)
 *
 * NOTE: env vars are read inside the function (not at the top of the file)
 * because server.js imports app.js BEFORE dotenv.config() runs (ES module
 * hoisting), so process.env is still empty when this file is first loaded.
 */
export const generateJSON = async (
  prompt,
  { temperature = 0.4, maxOutputTokens = 2048 } = {}
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in backend/config/config.env");
  }

  const primary = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
  const models = [...new Set([primary, fallback])];

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  let lastErr;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.post(
          `${GEMINI_BASE_URL}/${model}:generateContent`,
          body,
          {
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            timeout: 20000,
          }
        );
        return parseResponse(response);
      } catch (err) {
        lastErr = err;
        const status = err.response?.status;

        if (status === 404) break; // model name not found -> try next model

        const retryable =
          RETRYABLE_STATUS.includes(status) || err.code === "ECONNABORTED";
        if (!retryable) throw toError(err); // bad key, bad request, parse error...

        if (attempt < 2) await sleep(1500);
      }
    }
  }

  throw toError(lastErr);
};

export default { generateJSON };