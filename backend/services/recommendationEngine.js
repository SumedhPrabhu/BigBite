import Reel from "../models/reel.js";
import ReelInteraction from "../models/reelInteraction.js";
import Restaurant from "../models/restaurant.js";
import FoodItem from "../models/foodItem.js";

/**
 * 1. Centralized Signal Weights Configuration
 */
export const SIGNAL_WEIGHTS = {
  ORDERED: 10,
  ORDER_CLICKED: 7,
  LIKED: 5,
  COMPLETED: 4,
  WATCH_80: 3,
  WATCH_50: 2,
  VIEW: 1,
};

/**
 * Compute the interaction signal score from a ReelInteraction document
 */
export const getInteractionWeight = (interaction) => {
  if (!interaction) return 0;
  if (interaction.ordered) return SIGNAL_WEIGHTS.ORDERED;
  if (interaction.orderClicked) return SIGNAL_WEIGHTS.ORDER_CLICKED;
  if (interaction.liked) return SIGNAL_WEIGHTS.LIKED;
  if (interaction.completed) return SIGNAL_WEIGHTS.COMPLETED;
  if (interaction.completionRate >= 80) return SIGNAL_WEIGHTS.WATCH_80;
  if (interaction.completionRate >= 50) return SIGNAL_WEIGHTS.WATCH_50;
  return SIGNAL_WEIGHTS.VIEW;
};

/**
 * Normalization helper
 */
export const normalizeText = (str) =>
  (str || "").toLowerCase().replace(/[^a-z0-9]/g, " ").trim().replace(/\s+/g, " ");

export const normalize = normalizeText;

/**
 * 2. Extract User Food Preferences from Interaction History
 */
export const buildUserProfile = async (userId) => {
  if (!userId) return null;

  const interactions = await ReelInteraction.find({ user: userId })
    .populate({
      path: "reel",
      populate: { path: "restaurant foodItem" },
    })
    .lean();

  if (!interactions || interactions.length === 0) {
    return null;
  }

  const profile = {
    totalInteractions: interactions.length,
    dishes: {},
    dishTokens: {},
    categories: {},
    cuisines: {},
    foodTypes: {},
    tags: {},
    recommendationTags: {},
    seenReelIds: new Map(), // reelId -> { completed, completionRate, liked, ordered }
  };

  let totalSignalSum = 0;

  for (const item of interactions) {
    if (!item.reel) continue;
    const r = item.reel;
    const weight = getInteractionWeight(item);
    totalSignalSum += weight;

    // Record seen reel status for downranking
    profile.seenReelIds.set(r._id.toString(), {
      completed: !!item.completed,
      completionRate: item.completionRate || 0,
      liked: !!item.liked,
      ordered: !!item.ordered,
      orderClicked: !!item.orderClicked,
      watchTime: item.watchTime || 0,
    });

    // Dishes
    const dishKey = normalize(r.normalizedDish || r.dishName);
    profile.dishes[dishKey] = (profile.dishes[dishKey] || 0) + weight;

    // Dish Tokens (e.g. "biryani", "chicken", "dosa")
    const tokens = dishKey.split(" ").filter((t) => t.length > 2);
    for (const t of tokens) {
      profile.dishTokens[t] = (profile.dishTokens[t] || 0) + weight;
    }

    // Categories
    const catKey = normalize(r.category);
    if (catKey) {
      profile.categories[catKey] = (profile.categories[catKey] || 0) + weight;
    }

    // Cuisines
    const cuiKey = normalize(r.cuisine);
    if (cuiKey) {
      profile.cuisines[cuiKey] = (profile.cuisines[cuiKey] || 0) + weight;
    }

    // Food Types (veg vs non-veg)
    const ftKey = (r.foodType || "veg").toLowerCase();
    profile.foodTypes[ftKey] = (profile.foodTypes[ftKey] || 0) + weight;

    // Recommendation Tags
    if (Array.isArray(r.recommendationTags)) {
      for (const tag of r.recommendationTags) {
        const normTag = normalize(tag);
        if (normTag) {
          profile.recommendationTags[normTag] =
            (profile.recommendationTags[normTag] || 0) + weight;
        }
      }
    }

    // Tags
    if (Array.isArray(r.tags)) {
      for (const tag of r.tags) {
        const normTag = normalize(tag);
        if (normTag) {
          profile.tags[normTag] = (profile.tags[normTag] || 0) + weight;
        }
      }
    }
  }

  // Normalize weight maps into ratios (0 to 1)
  const normalizeMap = (map) => {
    const maxVal = Math.max(...Object.values(map), 1);
    const normalized = {};
    for (const [k, v] of Object.entries(map)) {
      normalized[k] = v / maxVal;
    }
    return normalized;
  };

  return {
    dishes: normalizeMap(profile.dishes),
    dishTokens: normalizeMap(profile.dishTokens),
    categories: normalizeMap(profile.categories),
    cuisines: normalizeMap(profile.cuisines),
    foodTypes: normalizeMap(profile.foodTypes),
    tags: normalizeMap(profile.tags),
    recommendationTags: normalizeMap(profile.recommendationTags),
    seenReelIds: profile.seenReelIds,
  };
};

/**
 * 3. Candidate Scoring Formula
 * Final Score =
 *   55% Personalization +
 *   20% Engagement +
 *   10% Quality +
 *    5% Freshness +
 *   10% Exploration
 */
export const scoreCandidateReel = (reel, userProfile, maxEngagement = 100) => {
  // 1. Quality Score (10%)
  const quality = Math.min(Math.max((reel.qualityScore || 5) / 10, 0), 1);

  // 2. Engagement Score (20%)
  const engagementRaw =
    (reel.likesCount || 0) * 3 +
    (reel.ordersCount || 0) * 6 +
    (reel.viewsCount || 0) * 1;
  const engagement = Math.min(engagementRaw / Math.max(maxEngagement, 10), 1);

  // 3. Freshness Factor (5%)
  const ageDays = (Date.now() - new Date(reel.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const freshness = Math.max(1 - Math.min(ageDays / 60, 1), 0.2);

  // 4. Exploration Factor (10%)
  const exploration = Math.random();

  // If Cold Start (no user profile)
  if (!userProfile) {
    const coldScore =
      0.45 * quality +
      0.30 * engagement +
      0.05 * freshness +
      0.20 * exploration;
    return {
      finalScore: coldScore,
      personalizationScore: 0,
      engagementScore: engagement,
      qualityScore: quality,
      freshnessScore: freshness,
      explorationScore: exploration,
    };
  }

  // 5. Personalization Score (55%)
  let personalScore = 0;
  const reelDish = normalize(reel.normalizedDish || reel.dishName);
  const reelTokens = reelDish.split(" ").filter((t) => t.length > 2);
  const reelCategory = normalize(reel.category);
  const reelCuisine = normalize(reel.cuisine);
  const reelFoodType = (reel.foodType || "veg").toLowerCase();

  // Dish match (Weight 0.35)
  if (userProfile.dishes[reelDish]) {
    personalScore += 0.35 * userProfile.dishes[reelDish];
  } else {
    // Token matches (Weight 0.25)
    let tokenScore = 0;
    for (const t of reelTokens) {
      if (userProfile.dishTokens[t]) {
        tokenScore = Math.max(tokenScore, userProfile.dishTokens[t]);
      }
    }
    personalScore += 0.25 * tokenScore;
  }

  // Category match (Weight 0.15)
  if (reelCategory && userProfile.categories[reelCategory]) {
    personalScore += 0.15 * userProfile.categories[reelCategory];
  }

  // Cuisine match (Weight 0.10)
  if (reelCuisine && userProfile.cuisines[reelCuisine]) {
    personalScore += 0.10 * userProfile.cuisines[reelCuisine];
  }

  // FoodType match (Weight 0.10)
  if (reelFoodType && userProfile.foodTypes[reelFoodType]) {
    personalScore += 0.10 * userProfile.foodTypes[reelFoodType];
  }

  // Recommendation tags match (Weight 0.05)
  if (Array.isArray(reel.recommendationTags)) {
    let tagScore = 0;
    for (const rt of reel.recommendationTags) {
      const nrt = normalize(rt);
      if (nrt && userProfile.recommendationTags[nrt]) {
        tagScore = Math.max(tagScore, userProfile.recommendationTags[nrt]);
      }
    }
    personalScore += 0.05 * tagScore;
  }

  personalScore = Math.min(Math.max(personalScore, 0), 1);

  // Combine weighted components
  let rawFinalScore =
    0.55 * personalScore +
    0.20 * engagement +
    0.10 * quality +
    0.05 * freshness +
    0.10 * exploration;

  // Downrank seen/watched reels
  const reelIdStr = reel._id.toString();
  if (userProfile.seenReelIds.has(reelIdStr)) {
    const seenMeta = userProfile.seenReelIds.get(reelIdStr);
    if (seenMeta.ordered) {
      rawFinalScore *= 0.2; // downrank strongly after order
    } else if (seenMeta.completed || seenMeta.completionRate >= 80) {
      rawFinalScore *= 0.3; // watched fully
    } else if (seenMeta.completionRate >= 50) {
      rawFinalScore *= 0.5;
    } else {
      rawFinalScore *= 0.7; // briefly viewed
    }
  }

  return {
    finalScore: rawFinalScore,
    personalizationScore: personalScore,
    engagementScore: engagement,
    qualityScore: quality,
    freshnessScore: freshness,
    explorationScore: exploration,
  };
};

/**
 * 4. Diversity Reranker
 * Strictly avoids consecutive reels sharing the same cuisine, category, dish, or restaurant.
 */
export const applyDiversityReranking = (rankedReels, maxConsecutive = 1) => {
  if (!rankedReels || rankedReels.length <= 1) {
    return rankedReels;
  }

  const result = [];
  const pool = [...rankedReels];

  while (pool.length > 0) {
    let chosenIndex = -1;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const candCategory = normalize(candidate.category);
      const candCuisine = normalize(candidate.cuisine);
      const candDish = normalize(candidate.normalizedDish || candidate.dishName);
      const candRest = candidate.restaurant?._id
        ? candidate.restaurant._id.toString()
        : "";

      // Check last N items in result
      if (result.length >= maxConsecutive) {
        const last1 = result[result.length - 1];

        const last1Cat = normalize(last1.category);
        const last1Cuisine = normalize(last1.cuisine);
        const last1Dish = normalize(last1.normalizedDish || last1.dishName);
        const last1Rest = last1.restaurant?._id
          ? last1.restaurant._id.toString()
          : "";

        const sameCat = candCategory && last1Cat === candCategory;
        const sameCuisine = candCuisine && last1Cuisine === candCuisine;
        const sameDish = candDish && last1Dish === candDish;
        const sameRest = candRest && last1Rest === candRest;

        if (sameCat || sameCuisine || sameDish || sameRest) {
          // Skip this candidate for now to avoid consecutive repetition
          continue;
        }
      }

      chosenIndex = i;
      break;
    }

    // If all remaining candidates violate constraint, take the next best available
    if (chosenIndex === -1) {
      chosenIndex = 0;
    }

    const [selected] = pool.splice(chosenIndex, 1);
    result.push(selected);
  }

  return result;
};

/**
 * 5. Main Recommendation Pipeline
 */
export const getRecommendedReels = async ({
  userId = null,
  limit = 8,
  page = 1,
  excludeIds = [],
}) => {
  // 1. Fetch all reels with populated references (including all 138 food reels)
  const candidateReels = await Reel.find({
    _id: { $nin: excludeIds },
  })
    .populate({
      path: "restaurant",
      select: "name cuisine address ratings location images numOfReviews",
    })
    .populate({
      path: "foodItem",
      select:
        "name price description category ratings images stock isVeg spiceLevel",
    })
    .lean();

  if (!candidateReels || candidateReels.length === 0) {
    return { reels: [], total: 0, page, hasMore: false };
  }

  // 2. Build user preference profile
  const userProfile = userId ? await buildUserProfile(userId) : null;

  // 3. Compute max engagement for normalization
  const maxEngagement = candidateReels.reduce((max, r) => {
    const raw =
      (r.likesCount || 0) * 3 +
      (r.ordersCount || 0) * 6 +
      (r.viewsCount || 0) * 1;
    return Math.max(max, raw);
  }, 10);

  // 4. Score every candidate reel
  const scoredReels = candidateReels.map((reel) => {
    const scoreBreakdown = scoreCandidateReel(reel, userProfile, maxEngagement);
    return {
      ...reel,
      score: scoreBreakdown.finalScore,
      _scoreDetails: scoreBreakdown,
    };
  });

  // 5. Sort by final score descending
  scoredReels.sort((a, b) => b.score - a.score);

  // 6. Apply diversity reranking
  const diversified = applyDiversityReranking(scoredReels, 2);

  // 7. Paginate / batch results
  const startIndex = (page - 1) * limit;
  const paginated = diversified.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < diversified.length;

  return {
    reels: paginated,
    total: diversified.length,
    page,
    hasMore,
    isPersonalized: !!userProfile,
  };
};

export default {
  SIGNAL_WEIGHTS,
  getInteractionWeight,
  buildUserProfile,
  scoreCandidateReel,
  applyDiversityReranking,
  getRecommendedReels,
};
