import mongoose from "mongoose";
import Order from "../models/order.js";
import FoodItem from "../models/foodItem.js";
import Cart from "../models/cartModel.js";
import Reel from "../models/reel.js";
import ReelInteraction from "../models/reelInteraction.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";

// Create a new order (direct or fallback)   =>  /api/v1/eats/orders/new
export const newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    deliveryInfo,
    itemsPrice,
    taxPrice,
    deliveryCharge,
    finalTotal,
    paymentInfo,
    restaurant,
    reelId,
  } = req.body;

  const order = await Order.create({
    orderItems,
    deliveryInfo,
    itemsPrice,
    taxPrice,
    deliveryCharge,
    finalTotal,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
    restaurant,
    orderStatus: "Processing",
  });

  // Clear customer cart
  await Cart.findOneAndDelete({ user: req.user._id });

  // Track Reel conversion if ordered via a Reel
  if (reelId) {
    try {
      await ReelInteraction.findOneAndUpdate(
        { user: req.user._id, reel: reelId },
        { $set: { ordered: true, orderClicked: true, lastInteractedAt: Date.now() } },
        { upsert: true }
      );
      await Reel.findByIdAndUpdate(reelId, { $inc: { ordersCount: 1 } });
    } catch (e) {
      console.log("Non-critical reel tracking error in newOrder:", e.message);
    }
  }

  res.status(201).json({
    success: true,
    order,
  });
});

// Get single order   =>   /api/v1/eats/orders/:id
export const getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email phoneNumber")
    .populate("restaurant")
    .exec();

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders   =>   /api/v1/eats/orders/me/myOrders
export const myOrders = catchAsyncErrors(async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id || req.user._id);
  const orders = await Order.find({ user: userId })
    .populate("user", "name email")
    .populate("restaurant")
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    orders,
  });
});

// Get restaurant orders => /api/v1/eats/orders/restaurant/:restaurantId
export const getRestaurantOrders = catchAsyncErrors(async (req, res, next) => {
  const { restaurantId } = req.params;
  const orders = await Order.find({ restaurant: restaurantId })
    .populate("user", "name email phoneNumber")
    .populate("restaurant")
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    orders,
  });
});

// Update order status => PUT /api/v1/eats/orders/:id/status
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  order.orderStatus = status || order.orderStatus;
  if (status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated",
    order,
  });
});

// Get all orders - ADMIN  =>   /api/v1/admin/orders/
export const allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find().sort({ createdAt: -1 });

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.finalTotal || 0;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

export default {
  newOrder,
  getSingleOrder,
  myOrders,
  getRestaurantOrders,
  updateOrderStatus,
  allOrders,
};
