import Menu from "../models/menu.js";
import Fooditem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

// GET ALL MENUS (Aggregates from Fooditem model)
export const getAllMenus = catchAsync(async (req, res, next) => {
  const filter = req.params.storeId ? { restaurant: req.params.storeId } : {};

  // Fetch all individual food items for the restaurant
  const items = await Fooditem.find(filter);

  // Group by category to match the expected Menu format
  const categoriesMap = {};
  items.forEach((item) => {
    const cat = item.category && item.category.trim() !== "" ? item.category : "All";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(item);
  });

  const formattedMenuArray = Object.keys(categoriesMap).map((cat) => ({
    category: cat,
    items: categoriesMap[cat],
  }));

  res.status(200).json({
    status: "success",
    count: 1,
    data: [
      {
        _id: req.params.storeId || "virtual-menu",
        restaurant: req.params.storeId,
        menu: formattedMenuArray,
      },
    ],
  });
});

// CREATE MENU
export const createMenu = catchAsync(async (req, res, next) => {
  const menu = await Menu.create(req.body);

  res.status(201).json({
    status: "success",
    data: menu,
  });
});

// DELETE MENU
export const deleteMenu = catchAsync(async (req, res, next) => {
  const menu = await Menu.findByIdAndDelete(req.params.menuId);

  if (!menu) {
    return next(new ErrorHandler("No document found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
  });
});

// ADD ITEM TO MENU
export const addItemToMenu = catchAsync(async (req, res, next) => {
  const { category, foodItemId } = req.body;
  const menuId = req.params.menuId;

  if (!menuId) {
    return next(new ErrorHandler("Menu ID is required", 400));
  }

  const menu = await Menu.findById(menuId);

  if (!menu) {
    return next(new ErrorHandler("Menu not found", 404));
  }

  let cat = menu.menu.find((c) => c.category === category);

  if (!cat) {
    cat = { category, items: [] };
    menu.menu.push(cat);
  }

  cat.items.push(foodItemId);

  await menu.save();
  await menu.populate("menu.items");

  res.status(200).json({
    status: "success",
    data: menu,
  });
});

export default {
  getAllMenus,
  createMenu,
  deleteMenu,
  addItemToMenu,
};