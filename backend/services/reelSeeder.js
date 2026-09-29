import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Reel from "../models/reel.js";
import Restaurant from "../models/restaurant.js";
import FoodItem from "../models/foodItem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "config", "config.env") });

// Normalization helper
export const normalizeText = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

// Deterministic matching helper
export const matchReelToFoodItem = (reel, foodItemsWithMeta, restaurantUsage) => {
  const reelNormDish = normalizeText(reel.dishName);
  const reelTokens = reelNormDish.split(" ").filter((t) => t.length > 2);
  const reelCategory = normalizeText(reel.category);
  const reelCuisine = normalizeText(reel.cuisine);
  const reelFoodType = (reel.foodType || "").toLowerCase();
  const reelKeywords = (reel.searchKeywords || []).map((k) => normalizeText(k));

  const candidates = [];

  for (const item of foodItemsWithMeta) {
    if (!item.restaurant) continue;

    let score = 0;
    let matchType = "";

    // 1. Exact normalized dish match (Priority #1)
    if (item.normName === reelNormDish) {
      score += 100;
      matchType = "exact_dish";
    }
    // 2. Substring containment match (Priority #2)
    else if (
      item.normName.includes(reelNormDish) ||
      reelNormDish.includes(item.normName)
    ) {
      score += 70;
      matchType = "substring_dish";
    }
    // 3. Token overlap match (Priority #3)
    else {
      const matchingTokens = reelTokens.filter((t) => item.tokens.has(t));
      if (matchingTokens.length > 0) {
        // Higher weight if multiple important tokens match
        score += matchingTokens.length * 25;
        matchType = "token_overlap";
      }
    }

    // 4. Keyword matches
    for (const kw of reelKeywords) {
      if (kw && (item.normName.includes(kw) || kw.includes(item.normName))) {
        score += 15;
      }
    }

    // 5. Category & Cuisine compatibility
    if (
      item.category &&
      (item.category.includes(reelCategory) ||
        reelCategory.includes(item.category))
    ) {
      score += 10;
    }
    if (
      item.cuisine &&
      (item.cuisine.includes(reelCuisine) || reelCuisine.includes(item.cuisine))
    ) {
      score += 10;
    }

    // Match threshold: Must have strong dish name or token alignment
    if (score >= 40) {
      candidates.push({
        foodItem: item.doc,
        restaurant: item.restaurant,
        score,
        matchType,
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort candidates by score descending, then by least-used restaurant to balance distribution
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const usageA = restaurantUsage[a.restaurant._id.toString()] || 0;
    const usageB = restaurantUsage[b.restaurant._id.toString()] || 0;
    return usageA - usageB;
  });

  const selected = candidates[0];
  const restId = selected.restaurant._id.toString();
  restaurantUsage[restId] = (restaurantUsage[restId] || 0) + 1;

  return selected;
};

export const seedReels = async () => {
  try {
    const dbUri = process.env.DB_URI || process.env.DB_LOCAL_URI;
    console.log("Connecting to MongoDB for Reels Seeding...");
    await mongoose.connect(dbUri);
    console.log("MongoDB Connected successfully.");

    // Locate Reels JSON directory
    const possiblePaths = [
      path.join(__dirname, "..", "..", "Reels Json"),
      path.join(__dirname, "..", "Reels Json"),
      path.join(process.cwd(), "Reels Json"),
    ];

    let reelsDir = possiblePaths.find((p) => fs.existsSync(p));
    if (!reelsDir) {
      throw new Error(`Reels JSON folder not found in: ${possiblePaths.join(", ")}`);
    }

    console.log(`Loading JSON files from: ${reelsDir}`);
    const files = fs.readdirSync(reelsDir).filter((f) => f.endsWith(".json"));
    console.log(`Found ${files.length} JSON files: ${files.join(", ")}`);

    let rawRecords = [];
    for (const file of files) {
      const filePath = path.join(reelsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`- ${file}: ${data.length} records`);
      rawRecords = rawRecords.concat(data);
    }

    console.log(`Total raw records across files: ${rawRecords.length}`);

    // Deduplicate by videoId
    const seenVideoIds = new Set();
    const uniqueRecords = [];
    const duplicateRecords = [];

    for (const r of rawRecords) {
      if (!r.videoId) continue;
      if (seenVideoIds.has(r.videoId)) {
        duplicateRecords.push({ datasetId: r.datasetId, videoId: r.videoId });
      } else {
        seenVideoIds.add(r.videoId);
        uniqueRecords.push(r);
      }
    }

    console.log(`Unique video IDs: ${uniqueRecords.length}`);
    console.log(`Duplicates detected & skipped: ${duplicateRecords.length}`);

    // Fetch existing Restaurants and FoodItems
    const restaurants = await Restaurant.find({});
    const foodItems = await FoodItem.find({});

    console.log(
      `Found ${restaurants.length} existing Restaurants and ${foodItems.length} FoodItems in DB.`
    );

    // Build lookup structure
    const foodItemsWithMeta = foodItems.map((f) => {
      const rest = restaurants.find(
        (r) =>
          r._id.toString() === (f.restaurant ? f.restaurant.toString() : "")
      );
      const normName = normalizeText(f.name);
      return {
        doc: f,
        restaurant: rest,
        normName,
        tokens: new Set(normName.split(" ")),
        category: normalizeText(f.category || ""),
        cuisine: normalizeText(rest?.cuisine || ""),
      };
    });

    const restaurantUsage = {};
    restaurants.forEach((r) => {
      restaurantUsage[r._id.toString()] = 0;
    });

    let mappedCount = 0;
    let unmatchedCount = 0;
    const distribution = {};

    // Process each unique reel and upsert into MongoDB
    for (const r of uniqueRecords) {
      const match = matchReelToFoodItem(
        r,
        foodItemsWithMeta,
        restaurantUsage
      );

      const reelDoc = {
        datasetId: r.datasetId,
        source: r.source || "youtube",
        videoId: r.videoId,
        videoUrl:
          r.videoUrl || `https://www.youtube.com/shorts/${r.videoId}`,
        durationSeconds: r.durationSeconds || 30,
        orientation: r.orientation || "vertical",
        dishName: r.dishName,
        normalizedDish: r.normalizedDish || normalizeText(r.dishName),
        category: r.category || "General",
        cuisine: r.cuisine || "Multi-Cuisine",
        foodType: r.foodType === "non-veg" ? "non-veg" : "veg",
        tags: Array.isArray(r.tags) ? r.tags : [],
        recommendationTags: Array.isArray(r.recommendationTags)
          ? r.recommendationTags
          : [],
        searchKeywords: Array.isArray(r.searchKeywords)
          ? r.searchKeywords
          : [],
        qualityScore: typeof r.qualityScore === "number" ? r.qualityScore : 5,
        restaurant: match ? match.restaurant._id : null,
        foodItem: match ? match.foodItem._id : null,
        isMatched: !!match,
      };

      // Idempotent upsert by videoId
      await Reel.findOneAndUpdate(
        { videoId: r.videoId },
        { $set: reelDoc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (match) {
        mappedCount++;
        const restName = match.restaurant.name;
        distribution[restName] = (distribution[restName] || 0) + 1;
      } else {
        unmatchedCount++;
      }
    }

    console.log("\n==========================================");
    console.log("REELS SEEDING COMPLETED SUCCESSFULLY");
    console.log("==========================================");
    console.log(`JSON Records Processed : ${rawRecords.length}`);
    console.log(`Unique Reels Inserted  : ${uniqueRecords.length}`);
    console.log(`Duplicates Handled     : ${duplicateRecords.length}`);
    console.log(`Reels Mapped           : ${mappedCount}`);
    console.log(`Reels Unmatched        : ${unmatchedCount}`);
    console.log(`Active Restaurants     : ${Object.keys(distribution).length}`);
    console.log("------------------------------------------");
    console.log("Restaurant Distribution:");
    Object.entries(distribution).forEach(([rest, count]) => {
      console.log(`  - ${rest}: ${count} reels`);
    });
    console.log("==========================================\n");

    return {
      totalProcessed: rawRecords.length,
      uniqueReels: uniqueRecords.length,
      duplicates: duplicateRecords.length,
      mappedCount,
      unmatchedCount,
      distribution,
    };
  } catch (error) {
    console.error("Error during Reels seeding:", error);
    throw error;
  }
};

// If run directly from CLI
if (
  process.argv[1] &&
  (process.argv[1].endsWith("reelSeeder.js") ||
    process.argv[1].includes("reelSeeder"))
) {
  seedReels()
    .then(() => {
      console.log("Seeding complete. Exiting.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

export default seedReels;
