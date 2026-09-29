import express from "express";
const router = express.Router();

import {
  signup,
  login,
  protect,
  getUserProfile,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout,
  saveFoodItem,
  removeSavedFoodItem,
  getSavedFoods,
  verifyEmailOTP,
  resendOTP,
} from "../controllers/authController.js";

// Public auth routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgetPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Email OTP verification (Public now, since user is created after verification)
router.post("/verify-email", verifyEmailOTP);
router.post("/resend-otp", resendOTP);

// Protected routes
router.use(protect);

router.get("/me", getUserProfile);
router.put("/password/update", updatePassword);
router.put("/me/update", updateProfile);

// Moved OTP routes to public

// Saved foods routes
router.get("/savedFoods", getSavedFoods);
router.get("/me/saved", getSavedFoods);
router.post("/savedFoods/:foodId", saveFoodItem);
router.post("/me/saved/:foodId", saveFoodItem);
router.delete("/savedFoods/:foodId", removeSavedFoodItem);
router.delete("/me/saved/:foodId", removeSavedFoodItem);

export default router;
