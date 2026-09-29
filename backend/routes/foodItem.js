import express from "express";
const router = express.Router({ mergeParams: true });

import {
  getAllFoodItems,
  createFoodItem,
  getFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodItemController.js";

// Mounted at /api/v1/eats
router.route("/items/:storeId").get(getAllFoodItems);
router.route("/item").post(createFoodItem);
router.route("/item/:foodId").get(getFoodItem).put(updateFoodItem).delete(deleteFoodItem);

export default router;
