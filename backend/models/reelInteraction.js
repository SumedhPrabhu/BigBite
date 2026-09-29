import mongoose from "mongoose";

const reelInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
      required: true,
      index: true,
    },
    watchTime: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    orderClicked: {
      type: Boolean,
      default: false,
    },
    ordered: {
      type: Boolean,
      default: false,
    },
    lastInteractedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One interaction document per user + reel
reelInteractionSchema.index({ user: 1, reel: 1 }, { unique: true });
reelInteractionSchema.index({ user: 1, lastInteractedAt: -1 });

const ReelInteraction = mongoose.model("ReelInteraction", reelInteractionSchema);
export default ReelInteraction;
