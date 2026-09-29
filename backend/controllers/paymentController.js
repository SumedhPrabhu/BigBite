import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/order.js";
import Cart from "../models/cartModel.js";
import User from "../models/user.js";
import Reel from "../models/reel.js";
import ReelInteraction from "../models/reelInteraction.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

/**
 * Initialize Razorpay Instance
 */
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured in backend environment");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/v1/payment/process (or /api/v1/payment/create-order)
 */
export const processPayment = catchAsyncErrors(async (req, res, next) => {
  const { items, restaurant, deliveryInfo, amount: explicitAmount, currency } = req.body;

  let totalPaise = 0;

  if (explicitAmount) {
    totalPaise = Math.round(Number(explicitAmount));
  } else if (items && items.length > 0) {
    const itemsPrice = items.reduce((acc, item) => {
      const price = item.foodItem?.price || item.price || 0;
      return acc + price * (item.quantity || 1);
    }, 0);

    const deliveryCharge = itemsPrice > 500 ? 0 : 40;
    const taxPrice = Math.round(itemsPrice * 0.05);
    const finalTotal = itemsPrice + deliveryCharge + taxPrice;
    totalPaise = Math.round(finalTotal * 100);
  } else {
    return next(new ErrorHandler("No items or amount provided to create Razorpay order", 400));
  }

  // Minimum amount validation: at least 100 paise (₹1)
  if (totalPaise < 100) {
    return next(
      new ErrorHandler("Order amount must be at least ₹1 (100 paise)", 400)
    );
  }

  try {
    const instance = getRazorpayInstance();
    const options = {
      amount: totalPaise,
      currency: currency || "INR",
      receipt: `snackr_rcpt_${Date.now()}`,
      notes: {
        userId: req.user?._id ? req.user._id.toString() : "guest",
        restaurantId: restaurant?._id || restaurant || "",
      },
    };

    const razorpayOrder = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay API Error:", err);
    return next(
      new ErrorHandler(
        err.message || "Failed to create order with Razorpay gateway",
        500
      )
    );
  }
});

/**
 * STEP 3: BACKEND - Verify Signature & Create Order
 * Endpoint: POST /api/v1/payment/verify (or /api/v1/payment/verify-payment)
 */
export const verifyPaymentAndCreateOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    deliveryInfo,
  } = req.body;

  // Missing fields validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(
      new ErrorHandler(
        "Missing required payment details: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        400
      )
    );
  }

  // HMAC-SHA256 Signature Verification
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return next(
      new ErrorHandler(
        "Payment verification failed: Signature mismatch. Order not placed.",
        400
      )
    );
  }

  // Retrieve customer's active cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: "items.foodItem",
      select: "name price images stock",
    })
    .populate({
      path: "restaurant",
      select: "name address",
    });

  if (!cart || !cart.items || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      verified: true,
      message: "Payment verified successfully.",
    });
  }

  // Calculate pricing breakdown
  const itemsPrice = cart.items.reduce((acc, item) => {
    return acc + (item.foodItem?.price || 0) * (item.quantity || 1);
  }, 0);

  const deliveryCharge = itemsPrice > 500 ? 0 : 40;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const finalTotal = itemsPrice + deliveryCharge + taxPrice;

  // Format order items
  const orderItems = cart.items.map((item) => ({
    name: item.foodItem?.name || "Dish",
    quantity: item.quantity,
    image: item.foodItem?.images?.[0]?.url || "/images/default_avatar.jpg",
    price: item.foodItem?.price || 0,
    fooditem: item.foodItem?._id,
  }));

  // Build clean delivery info
  const shippingDetails = {
    address:
      deliveryInfo?.address ||
      req.user.deliveryInfo?.address ||
      "Primary Delivery Address",
    city: deliveryInfo?.city || req.user.deliveryInfo?.city || "City",
    phoneNo:
      deliveryInfo?.phoneNo ||
      req.user.phoneNumber ||
      "0000000000",
    postalCode:
      deliveryInfo?.postalCode ||
      req.user.deliveryInfo?.postalCode ||
      "000000",
    country: deliveryInfo?.country || "IN",
  };

  const paymentInfo = {
    id: razorpay_payment_id,
    status: "paid",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  };

  // Create the permanent Snackr Order
  const order = await Order.create({
    orderItems,
    deliveryInfo: shippingDetails,
    paymentInfo,
    itemsPrice,
    taxPrice,
    deliveryCharge,
    finalTotal,
    user: req.user.id || req.user._id,
    restaurant: cart.restaurant?._id,
    paidAt: Date.now(),
    orderStatus: "Processing",
  });

  // Clear customer cart
  await Cart.findOneAndDelete({ user: req.user._id });

  // Save the delivery info to the user profile for future use
  await User.findByIdAndUpdate(req.user._id, {
    deliveryInfo: {
      address: shippingDetails.address,
      city: shippingDetails.city,
      phoneNo: shippingDetails.phoneNo,
      postalCode: shippingDetails.postalCode,
      country: shippingDetails.country,
    }
  });

  // Track Reel conversion if ordered via a Reel
  const originReelId = req.body.reelId;
  if (originReelId) {
    try {
      await ReelInteraction.findOneAndUpdate(
        { user: req.user._id, reel: originReelId },
        { $set: { ordered: true, orderClicked: true, lastInteractedAt: Date.now() } },
        { upsert: true }
      );
      await Reel.findByIdAndUpdate(originReelId, { $inc: { ordersCount: 1 } });
    } catch (e) {
      console.log("Non-critical reel tracking error:", e.message);
    }
  }

  res.status(200).json({
    success: true,
    verified: true,
    message: "Payment verified and order placed successfully",
    order,
  });
});

/**
 * Send Razorpay Public Key   =>   GET /api/v1/razorpay/key
 */
export const getRazorpayKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || "",
  });
});

export default {
  processPayment,
  verifyPaymentAndCreateOrder,
  getRazorpayKey,
};
