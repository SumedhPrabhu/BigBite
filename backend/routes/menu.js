import express from "express";
const router = express.Router({ mergeParams: true });

import {
  getAllMenus,
  createMenu,
  deleteMenu,
  addItemToMenu,
} from "../controllers/menuController.js";

// GET /api/v1/eats/stores/menus OR /api/v1/eats/stores/:storeId/menus
router.route("/").get(getAllMenus).post(createMenu);

// DELETE /api/v1/eats/stores/menus/:menuId
router.route("/:menuId").delete(deleteMenu);

// POST /api/v1/eats/stores/menus/:menuId/items
router.route("/:menuId/items").post(addItemToMenu);

export default router;
