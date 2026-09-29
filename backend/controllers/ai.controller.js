import catchAsync from "../middlewares/catchAsyncErrors.js";
import { generateDishDescription } from "../services/ai.service.js";
import { analyzeReviewsWithAI } from "../services/aiReviewAnalyzer.js";
import FoodItem from "../models/foodItem.js";
import Restaurant from "../models/restaurant.js";

export const generateFoodAI = catchAsync(async (req, res) => {
  const { name, category, spiceLevel, price } = req.body;
  if (!name || !category || !spiceLevel || !price) {
    return res.status(400).json({
      success: false,
      message: "name, category, spiceLevel and price are required",
    });
  }

  const aiData = await generateDishDescription({
    name,
    category,
    spiceLevel,
    price,
  });

  res.status(200).json({
    success: true,
    data: aiData,
  });
});

export const generateAndSaveFoodAI = catchAsync(async (req, res) => {
  const { foodId } = req.params;

  const food = await FoodItem.findById(foodId);
  if (!food) {
    return res.status(404).json({
      success: false,
      message: "Food item not found",
    });
  }

  const aiData = await generateDishDescription({
    name: food.name,
    category: food.category || "Veg",
    spiceLevel: food.spiceLevel || "Medium",
    price: food.price,
  });

  food.aiDescription = aiData.description;
  food.aiTags = aiData.tags;
  food.aiAllergens = aiData.allergens;
  food.aiServes = aiData.serves;
  food.aiBestFor = aiData.bestFor;
  await food.save();

  res.status(200).json({
    success: true,
    message: "AI metadata generated and saved",
    data: aiData,
  });
});

export const analyzeRestaurantReviews = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (!restaurant.reviews.length) {
      return res.status(400).json({ message: "No reviews to analyze" });
    }

    const aiData = await analyzeReviewsWithAI(restaurant.reviews);

    restaurant.reviewSentiment = aiData.sentiment;
    restaurant.reviewSummaryBullets = aiData.summaryBullets;
    restaurant.reviewTopMentions = aiData.topMentions;

    await restaurant.save();
    res.status(200).json({ success: true, aiData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const addReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, rating, Comment } = req.body;

  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  restaurant.reviews.push({
    name,
    rating: Number(rating),
    Comment,
  });

  restaurant.numOfReviews = restaurant.reviews.length;

  const totalRatings = restaurant.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  restaurant.ratings = totalRatings / restaurant.reviews.length;

  try {
    const aiData = await analyzeReviewsWithAI(restaurant.reviews);

    restaurant.reviewSentiment = aiData.sentiment;
    restaurant.reviewSummaryBullets = aiData.summaryBullets;
    restaurant.reviewTopMentions = aiData.topMentions;
  } catch (error) {
    console.log("AI Analysis Failed:", error.message);
  }

  await restaurant.save();

  res.status(200).json({
    success: true,
    message: "Review Added Successfully",
    restaurant,
  });
});

export default {
  generateFoodAI,
  generateAndSaveFoodAI,
  analyzeRestaurantReviews,
  addReview,
};