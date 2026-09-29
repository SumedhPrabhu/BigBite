import Fooditem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";
import APIFeatures from "../utils/apiFeatures.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllFoodItems = catchAsync(async (req, res, next) => {
  let restaurantId = {};
  if (req.params.storeId) {
    restaurantId = { restaurant: req.params.storeId };
  }

  const foodItems = await Fooditem.find(restaurantId).populate("restaurant");
  res.status(200).json({
    status: "success",
    results: foodItems.length,
    data: foodItems,
  });
});

export const createFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (req.files && req.files.image) {
    const file = req.files.image;
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const uploadPath = path.join(__dirname, "../public/uploads", filename);
    await file.mv(uploadPath);
    body.images = [
      {
        public_id: `local_${filename}`,
        url: `/uploads/${filename}`,
      },
    ];
  } else if (body.imageUrl) {
    body.images = [
      {
        public_id: "default",
        url: body.imageUrl,
      },
    ];
    delete body.imageUrl;
  }

  const fooditem = await Fooditem.create(body);
  res.status(201).json({
    status: "success",
    data: fooditem,
  });
});

export const getFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId);

  if (!foodItem)
    return next(new ErrorHandler("No foodItem found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

export const updateFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (req.files && req.files.image) {
    const file = req.files.image;
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const uploadPath = path.join(__dirname, "../public/uploads", filename);
    await file.mv(uploadPath);
    body.images = [
      {
        public_id: `local_${filename}`,
        url: `/uploads/${filename}`,
      },
    ];
  } else if (body.imageUrl) {
    body.images = [
      {
        public_id: "default",
        url: body.imageUrl,
      },
    ];
    delete body.imageUrl;
  }

  const foodItem = await Fooditem.findByIdAndUpdate(
    req.params.foodId,
    body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!foodItem)
    return next(new ErrorHandler("No document found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

export const deleteFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndDelete(req.params.foodId);

  if (!foodItem)
    return next(new ErrorHandler("No document found with that ID", 404));

  res.status(204).json({
    status: "success",
  });
});

export default {
  getAllFoodItems,
  createFoodItem,
  getFoodItem,
  updateFoodItem,
  deleteFoodItem,
};
