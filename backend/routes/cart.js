import express from "express";
const router = express.Router();

import {
  addItemToCart,
  updateCartItemQuantity,
  deleteCartItem,
  getCartItem,
} from "../controllers/cartController.js";
import { protect } from "../controllers/authController.js";

// Mounted at /api/v1/eats/cart
router.post("/add-to-cart", protect, addItemToCart);
router.post("/update-cart-item", protect, updateCartItemQuantity);
router.delete("/delete-cart-item", protect, deleteCartItem);
router.get("/get-cart", protect, getCartItem);

export default router;
