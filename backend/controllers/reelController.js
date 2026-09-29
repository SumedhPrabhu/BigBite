import Reel from "../models/reel.js";
import ReelInteraction from "../models/reelInteraction.js";
import FoodItem from "../models/foodItem.js";
import Restaurant from "../models/restaurant.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import {
  getRecommendedReels,
  normalizeText,
} from "../services/recommendationEngine.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";

/**
 * Optional user authentication extractor
 * Decodes JWT token if present in headers or cookies without blocking guests
 */
export const getOptionalUser = async (req) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return null;

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    if (!decoded || !decoded.id) return null;

    const user = await User.findById(decoded.id).select("-password");
    return user;
  } catch (err) {
    return null;
  }
};

/**
 * 1. GET /api/v1/reels/feed
 * Fetch personalized / cold-start recommendation feed (5-10 reels per batch)
 */
export const getReelsFeed = catchAsyncErrors(async (req, res, next) => {
  const user = req.user || (await getOptionalUser(req));
  const userId = user?._id || null;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 8;
  const excludeIds = req.query.exclude
    ? req.query.exclude.split(",").filter(Boolean)
    : [];

  const { reels, total, hasMore, isPersonalized } =
    await getRecommendedReels({
      userId,
      limit,
      page,
      excludeIds,
    });

  // If user is logged in, attach user's interaction flags (liked, saved)
  let userLikedReelIds = new Set();
  if (userId) {
    const reelIds = reels.map((r) => r._id);
    const interactions = await ReelInteraction.find({
      user: userId,
      reel: { $in: reelIds },
    })
      .select("reel liked completionRate completed")
      .lean();

    interactions.forEach((inter) => {
      if (inter.liked) {
        userLikedReelIds.add(inter.reel.toString());
      }
    });
  }

  const enrichedReels = reels.map((reel) => ({
    ...reel,
    isLiked: userLikedReelIds.has(reel._id.toString()),
  }));

  res.status(200).json({
    success: true,
    count: enrichedReels.length,
    total,
    page,
    hasMore,
    isPersonalized,
    reels: enrichedReels,
  });
});

/**
 * 2. POST /api/v1/reels/:reelId/like
 * Toggle like/unlike on a reel for authenticated user
 */
export const toggleLikeReel = catchAsyncErrors(async (req, res, next) => {
  const { reelId } = req.params;
  const userId = req.user._id;

  const reel = await Reel.findById(reelId);
  if (!reel) {
    return next(new ErrorHandler("Reel not found", 404));
  }

  let interaction = await ReelInteraction.findOne({
    user: userId,
    reel: reelId,
  });

  let liked = true;

  if (interaction) {
    liked = !interaction.liked;
    interaction.liked = liked;
    interaction.lastInteractedAt = Date.now();
    await interaction.save();
  } else {
    liked = true;
    interaction = await ReelInteraction.create({
      user: userId,
      reel: reelId,
      liked: true,
      lastInteractedAt: Date.now(),
    });
  }

  // Atomically update like counter on reel
  const delta = liked ? 1 : -1;
  const updatedReel = await Reel.findByIdAndUpdate(
    reelId,
    { $inc: { likesCount: delta } },
    { new: true }
  );

  // Guard against negative likes count
  if (updatedReel.likesCount < 0) {
    updatedReel.likesCount = 0;
    await updatedReel.save();
  }

  res.status(200).json({
    success: true,
    liked,
    likesCount: updatedReel.likesCount,
    message: liked ? "Reel liked" : "Reel unliked",
  });
});

/**
 * 3. POST /api/v1/reels/:reelId/interaction
 * Track watch duration, completion rate, order clicks
 */
export const recordReelInteraction = catchAsyncErrors(async (req, res, next) => {
  const { reelId } = req.params;
  const { watchTime = 0, completionRate = 0, completed = false, orderClicked = false } =
    req.body;

  const user = req.user || (await getOptionalUser(req));
  const userId = user?._id || null;

  // Increment global views count if watched > 2 seconds
  if (watchTime >= 2) {
    await Reel.findByIdAndUpdate(reelId, { $inc: { viewsCount: 1 } });
  }

  if (userId) {
    let interaction = await ReelInteraction.findOne({
      user: userId,
      reel: reelId,
    });

    if (interaction) {
      interaction.watchTime = Math.max(interaction.watchTime || 0, Number(watchTime) || 0);
      interaction.completionRate = Math.max(
        interaction.completionRate || 0,
        Number(completionRate) || 0
      );
      interaction.completed = interaction.completed || Boolean(completed);
      if (orderClicked) interaction.orderClicked = true;
      interaction.lastInteractedAt = Date.now();
      await interaction.save();
    } else {
      interaction = await ReelInteraction.create({
        user: userId,
        reel: reelId,
        watchTime: Number(watchTime) || 0,
        completionRate: Number(completionRate) || 0,
        completed: Boolean(completed),
        orderClicked: Boolean(orderClicked),
        lastInteractedAt: Date.now(),
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Interaction recorded successfully",
  });
});

/**
 * 4. GET /api/v1/reels/:reelId/order-options
 * Search and return:
 * - Result #1: FEATURED IN THIS REEL (guaranteed mapped restaurant + food item)
 * - Alternatives: Matching dishes from other Snackr restaurants (featured excluded)
 */
export const getOrderOptions = catchAsyncErrors(async (req, res, next) => {
  const { reelId } = req.params;

  const reel = await Reel.findById(reelId)
    .populate({
      path: "restaurant",
      select: "name cuisine address ratings numOfReviews location images",
    })
    .populate({
      path: "foodItem",
      select: "name price description category ratings images stock isVeg spiceLevel",
    });

  if (!reel) {
    return next(new ErrorHandler("Reel not found", 404));
  }

  const user = req.user || (await getOptionalUser(req));
  if (user?._id) {
    // Record order click signal
    await ReelInteraction.findOneAndUpdate(
      { user: user._id, reel: reel._id },
      { $set: { orderClicked: true, lastInteractedAt: Date.now() } },
      { upsert: true }
    );
  }

  // Guaranteed Featured #1 result
  let featured = null;
  if (reel.restaurant && reel.foodItem) {
    featured = {
      restaurant: reel.restaurant,
      foodItem: reel.foodItem,
      isFeatured: true,
      badge: "FEATURED IN THIS REEL",
    };
  }

  // Deterministic search for alternative restaurants offering this dish
  const normDish = normalizeText(reel.dishName);
  const dishTokens = normDish.split(" ").filter((t) => t.length > 2);
  const searchKeywords = (reel.searchKeywords || []).map((k) => normalizeText(k));
  const categoryNorm = normalizeText(reel.category);

  // Fetch all other FoodItems
  const query = {};
  if (reel.foodItem?._id) {
    query._id = { $ne: reel.foodItem._id };
  }
  if (reel.restaurant?._id) {
    query.restaurant = { $ne: reel.restaurant._id };
  }

  const otherFoodItems = await FoodItem.find(query)
    .populate({
      path: "restaurant",
      select: "name cuisine address ratings numOfReviews location images",
    })
    .lean();

  // Score candidate alternative dishes deterministically
  const candidateMatches = [];

  for (const item of otherFoodItems) {
    if (!item.restaurant) continue;

    const itemNorm = normalizeText(item.name);
    let matchScore = 0;

    // 1. Exact normalized dish match
    if (itemNorm === normDish) {
      matchScore += 100;
    }
    // 2. Substring match
    else if (itemNorm.includes(normDish) || normDish.includes(itemNorm)) {
      matchScore += 70;
    }
    // 3. Token overlap match
    else {
      const itemTokens = new Set(itemNorm.split(" "));
      const matchingTokens = dishTokens.filter((t) => itemTokens.has(t));
      if (matchingTokens.length > 0) {
        matchScore += matchingTokens.length * 30;
      }
    }

    // 4. Keyword match
    for (const kw of searchKeywords) {
      if (kw && (itemNorm.includes(kw) || kw.includes(itemNorm))) {
        matchScore += 15;
      }
    }

    // 5. Category compatibility
    if (item.category && normalizeText(item.category) === categoryNorm) {
      matchScore += 10;
    }

    if (matchScore >= 35) {
      candidateMatches.push({
        foodItem: item,
        restaurant: item.restaurant,
        score: matchScore,
      });
    }
  }

  // Sort alternatives by match score descending, then by restaurant rating
  candidateMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.restaurant?.ratings || 0) - (a.restaurant?.ratings || 0);
  });

  // Deduplicate by restaurant: show at most 1 best dish per alternative restaurant
  const seenRestaurants = new Set();
  if (reel.restaurant?._id) {
    seenRestaurants.add(reel.restaurant._id.toString());
  }

  const uniqueAlternatives = [];
  for (const match of candidateMatches) {
    const rId = match.restaurant._id.toString();
    if (!seenRestaurants.has(rId)) {
      seenRestaurants.add(rId);
      uniqueAlternatives.push({
        restaurant: match.restaurant,
        foodItem: match.foodItem,
        isFeatured: false,
      });
    }
    if (uniqueAlternatives.length >= 6) break;
  }

  res.status(200).json({
    success: true,
    reel: {
      _id: reel._id,
      dishName: reel.dishName,
      normalizedDish: reel.normalizedDish,
      category: reel.category,
      cuisine: reel.cuisine,
      foodType: reel.foodType,
      qualityScore: reel.qualityScore,
    },
    featured,
    alternatives: uniqueAlternatives,
  });
});

/**
 * 5. POST /api/v1/reels/:reelId/order-conversion
 * Record successful order conversion from reel (highest recommendation signal: +10)
 */
export const trackOrderConversion = catchAsyncErrors(async (req, res, next) => {
  const { reelId } = req.params;
  const userId = req.user._id;

  const reel = await Reel.findById(reelId);
  if (!reel) {
    return next(new ErrorHandler("Reel not found", 404));
  }

  await ReelInteraction.findOneAndUpdate(
    { user: userId, reel: reelId },
    {
      $set: {
        ordered: true,
        orderClicked: true,
        lastInteractedAt: Date.now(),
      },
    },
    { upsert: true, new: true }
  );

  await Reel.findByIdAndUpdate(reelId, { $inc: { ordersCount: 1 } });

  res.status(200).json({
    success: true,
    message: "Order conversion recorded for recommendation engine",
  });
});

export default {
  getReelsFeed,
  toggleLikeReel,
  recordReelInteraction,
  getOrderOptions,
  trackOrderConversion,
};
