import { generateJSON } from "./Gemini.js";

// Frontend calls .forEach on these, so they must always be arrays
const toArray = (v) =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : [];

export const generateDishDescription = async ({
  name,
  category,
  spiceLevel,
  price,
}) => {
  const prompt = `
You are a professional food menu and metadata generator for a food delivery platform named Snackr.

Generate ONLY valid JSON.
No markdown backticks.
No conversational explanation.

Dish Details:
- Name: ${name}
- Category: ${category}
- Spice Level: ${spiceLevel}
- Base Price: ₹${price}

Output JSON Schema:
{
  "description": "An enticing, professional 1-2 sentence description of the dish highlighting taste and preparation.",
  "tags": ["3-5 descriptive culinary tags like 'Spicy', 'Crispy', 'Comfort Food'"],
  "allergens": ["list of common allergens like 'Dairy', 'Gluten', 'Nuts' or 'None'"],
  "serves": "1-2 People",
  "bestFor": ["Lunch", "Dinner", "Snack", "Late Night"]
}
`;

  // Mock output so you can develop without spending API quota
  if (process.env.AI_BYPASS === "true") {
    return {
      description: `Delicious ${name} freshly prepared with authentic spices and ingredients, served hot and fresh.`,
      tags: [category || "Fresh", spiceLevel || "Medium", "Popular"],
      allergens: ["Dairy", "Gluten"],
      serves: "1-2 People",
      bestFor: ["Lunch", "Dinner"],
    };
  }

  try {
    const ai = await generateJSON(prompt, { temperature: 0.4 });

    return {
      description:
        typeof ai.description === "string" && ai.description.trim()
          ? ai.description.trim()
          : `Freshly prepared ${name}, crafted with authentic ingredients and rich flavors.`,
      tags: toArray(ai.tags),
      allergens: toArray(ai.allergens),
      serves: typeof ai.serves === "string" && ai.serves ? ai.serves : "1-2 People",
      bestFor: toArray(ai.bestFor),
    };
  } catch (error) {
    console.error("Gemini AI Food Metadata Generation Error:", error.message);
    return {
      description: `Freshly prepared ${name}, crafted with authentic ingredients and rich flavors.`,
      tags: [category || "Popular", spiceLevel || "Flavorful", "Chef Special"],
      allergens: ["None declared"],
      serves: "1 Person",
      bestFor: ["Lunch", "Dinner"],
    };
  }
};

export default {
  generateDishDescription,
};