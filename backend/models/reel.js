import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    datasetId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: "youtube",
    },
    videoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    durationSeconds: {
      type: Number,
      default: 30,
    },
    orientation: {
      type: String,
      default: "vertical",
    },
    dishName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedDish: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      index: true,
      trim: true,
    },
    cuisine: {
      type: String,
      default: "Multi-Cuisine",
      index: true,
      trim: true,
    },
    foodType: {
      type: String,
      enum: ["veg", "non-veg"],
      default: "veg",
    },
    tags: {
      type: [String],
      default: [],
    },
    recommendationTags: {
      type: [String],
      default: [],
    },
    searchKeywords: {
      type: [String],
      default: [],
    },
    qualityScore: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      default: null,
    },
    isMatched: {
      type: Boolean,
      default: false,
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

reelSchema.index({ normalizedDish: 1, category: 1 });
reelSchema.index({ restaurant: 1 });
reelSchema.index({ isMatched: 1, qualityScore: -1 });

const Reel = mongoose.model("Reel", reelSchema);
export default Reel;
