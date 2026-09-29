import { generateJSON } from "./Gemini.js";

// Must match the enum in models/restaurant.js or restaurant.save() will throw
const VALID_SENTIMENTS = ["positive", "negative", "mixed", "neutral"];

const toArray = (v) =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : [];

export const analyzeReviewsWithAI = async (reviews) => {
  const reviewTexts = (reviews || [])
    .map((r) => r.Comment || r.comment)
    .filter(Boolean)
    .slice(-50); // keep the prompt small: latest 50 reviews

  if (reviewTexts.length === 0) {
    return {
      sentiment: "neutral",
      summaryBullets: ["No reviews available yet"],
      topMentions: [],
    };
  }

  if (process.env.AI_BYPASS === "true") {
    return {
      sentiment: "neutral",
      summaryBullets: ["AI Analysis unavailable (AI bypass enabled)"],
      topMentions: [],
    };
  }

  const prompt = `
You are a food critic review analyst for Snackr food delivery.
Analyze the following customer reviews for a restaurant:

Reviews:
${reviewTexts.join("\n")}

Respond ONLY with a valid JSON object matching this schema:
{
  "sentiment": "positive" | "mixed" | "negative",
  "summaryBullets": [
    "1-2 concise highlight points summarizing customer sentiment"
  ],
  "topMentions": [
    "3-5 top recurring keywords or phrases (without hashtags) that capture the essence of the reviews"
  ]
}
`;

  try {
    const ai = await generateJSON(prompt, { temperature: 0.3 });

    const sentiment = String(ai.sentiment || "").toLowerCase();
    const summaryBullets = toArray(ai.summaryBullets);

    return {
      sentiment: VALID_SENTIMENTS.includes(sentiment) ? sentiment : "neutral",
      summaryBullets: summaryBullets.length
        ? summaryBullets
        : ["Unable to generate AI summary at this time."],
      topMentions: toArray(ai.topMentions),
    };
  } catch (error) {
    console.error("Gemini AI Review Analysis Error:", error.message);
    return {
      sentiment: "neutral",
      summaryBullets: ["Unable to generate AI summary at this time."],
      topMentions: [],
    };
  }
};

export default {
  analyzeReviewsWithAI,
};