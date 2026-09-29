import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "../models/restaurant.js";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeReviewsWithAI } from "../services/aiReviewAnalyzer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../config/config.env") });

const generateAllInsights = async () => {
  try {
    const uri = process.env.DB_LOCAL_URI || process.env.DB_URI;
    console.log("Connecting to Database:", uri);
    await mongoose.connect(uri);

    const restaurants = await Restaurant.find({ 
      $or: [
        { reviewSentiment: { $exists: false } },
        { reviewSentiment: null }
      ]
    });
    console.log(`Found ${restaurants.length} restaurants needing AI insights...`);

    let count = 0;
    for (let restaurant of restaurants) {
      if (restaurant.reviews && restaurant.reviews.length > 0) {
        console.log(`Generating AI insights for: ${restaurant.name}`);
        try {
          const aiData = await analyzeReviewsWithAI(restaurant.reviews);
          restaurant.reviewSentiment = aiData.sentiment;
          restaurant.reviewSummaryBullets = aiData.summaryBullets;
          restaurant.reviewTopMentions = aiData.topMentions;
          
          await restaurant.save({ validateBeforeSave: false });
          console.log(`Success: ${restaurant.name}`);
          count++;
        } catch (err) {
          console.error(`Failed for ${restaurant.name}:`, err.message);
        }
      }
    }
    
    console.log(`Finished generating AI insights for ${count} restaurants.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

generateAllInsights();
