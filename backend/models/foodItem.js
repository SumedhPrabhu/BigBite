import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter FoodItem name"],
    trim: true,
    maxLength: [100, "FoodItem name cannot exceed 100 characters"],
  },
  price: {
    type: Number,
    required: [true, "Please enter FoodItem price"],
    maxLength: [5, "FoodItem name cannot exceed 5 characters"],
    default: 0.0,
  },
  description: {
    type: String,
    required: [true, "Please enter FoodItem description"],
  },
  category: {
    type: String,
    trim: true,
    default: "",
  },
  spiceLevel: {
    type: String,
    enum: ["No Spice", "Mild", "Medium", "Spicy"],
    default: "Medium",
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
  },
  stock: {
    type: Number,
    required: [true, "Please enter foodItem stock"],
    maxLength: [5, "foodItems can't exceed 5 characters"],
    default: 0,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      Comment: {
        type: String,
        required: true,
      },
    },
  ],
  // AI fields
  aiDescription: {
    type: String,
    default: "",
  },
  aiTags: {
    type: [String],
    default: [],
  },
  aiAllergens: {
    type: [String],
    default: [],
  },
  aiServes: {
    type: String,
    default: "",
  },
  aiBestFor: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FoodItem = mongoose.model("FoodItem", foodSchema);
export default FoodItem;
