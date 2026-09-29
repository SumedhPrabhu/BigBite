import express from "express";
const router = express.Router();

import {
  processPayment,
  verifyPaymentAndCreateOrder,
  getRazorpayKey,
} from "../controllers/paymentController.js";
import { protect } from "../controllers/authController.js";

// Razorpay Order Creation: POST /api/v1/payment/process or /api/v1/payment/create-order or /api/v1/create-order
router.route("/payment/process").post(protect, processPayment);
router.route("/payment/create-order").post(protect, processPayment);
router.route("/create-order").post(protect, processPayment);

// Razorpay Payment Signature Verification & Snackr Order creation: POST /api/v1/payment/verify or /api/v1/payment/verify-payment or /api/v1/verify-payment
router.route("/payment/verify").post(protect, verifyPaymentAndCreateOrder);
router.route("/payment/verify-payment").post(protect, verifyPaymentAndCreateOrder);
router.route("/verify-payment").post(protect, verifyPaymentAndCreateOrder);

// Razorpay Public Key: GET /api/v1/razorpay/key
router.route("/razorpay/key").get(getRazorpayKey);

export default router;
