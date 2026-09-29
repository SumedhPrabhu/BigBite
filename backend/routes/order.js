import express from "express";
const router = express.Router();

import {
  newOrder,
  getSingleOrder,
  myOrders,
  allOrders,
  getRestaurantOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../controllers/authController.js";

// Mounted at /api/v1/eats/orders
router.route("/new").post(protect, newOrder);
router.route("/me/myOrders").get(protect, myOrders);
router.route("/restaurant/:restaurantId").get(protect, getRestaurantOrders);
router.route("/:id/status").put(protect, updateOrderStatus);
router.route("/:id").get(protect, getSingleOrder);
router.route("/admin/orders").get(protect, authorizeRoles("admin"), allOrders);

export default router;
