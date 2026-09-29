import express from "express";
const router = express.Router();

import {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addRestaurantReview,
} from "../controllers/restaurantController.js";
import { protect } from "../controllers/authController.js";

// Mounted at /api/v1/eats/stores
router.route("/").get(getAllRestaurants).post(protect, createRestaurant);
router.route("/:storeId").get(getRestaurant).put(protect, updateRestaurant).delete(protect, deleteRestaurant);
router.route("/:storeId/review").post(protect, addRestaurantReview);
router.route("/:storeId/reviews").post(protect, addRestaurantReview);

// Menu subroutes — mounted at /api/v1/eats/stores as well
import { getAllMenus, createMenu, deleteMenu, addItemToMenu } from "../controllers/menuController.js";

router.route("/:storeId/menus").get(getAllMenus).post(protect, createMenu);
router.route("/:storeId/menus/:menuId").delete(protect, deleteMenu);
router.route("/:storeId/menus/:menuId/addItem").post(protect, addItemToMenu);

export default router;
