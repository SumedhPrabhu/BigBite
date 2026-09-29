import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter the restaurant name"],
    trim: true,
    maxLength: [100, "Restaurant name cannot exceed 100 characters"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isVeg: {
    type: Boolean,
    default: false,
  },
  cuisine: {
    type: String,
    default: "Multi-Cuisine",
  },
  address: {
    type: String,
    required: [true, "Please enter the restaurant address"],
  },
  pincode: {
    type: String,
    default: "",
  },
  estDate: {
    type: Date,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
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

  // AI review intelligence
  reviewSentiment: {
    type: String,
    enum: ["positive", "negative", "mixed", "neutral"],
  },
  reviewSummaryBullets: [String],
  reviewTopMentions: [String],

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

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ address: "text" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
