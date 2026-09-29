import Restaurant from "../models/restaurant.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";
import APIFeatures from "../utils/apiFeatures.js";
import path from "path";
import { fileURLToPath } from "url";

export const getAllRestaurants = catchAsync(async (req, res, next) => {
  const apiFeatures = new APIFeatures(Restaurant.find(), req.query);
  await apiFeatures.search();
  apiFeatures.sort();
  const restaurants = await apiFeatures.query;
  res.status(200).json({
    status: "success",
    count: restaurants.length,
    restaurants: restaurants,
  });
});

export const createRestaurant = catchAsync(async (req, res, next) => {
  const data = { ...req.body };

  // Link owner if authenticated
  if (req.user) {
    data.owner = req.user._id;
  }

  const restaurant = await Restaurant.create(data);

  // Link restaurant to user
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      restaurantId: restaurant._id,
      role: req.user.role === "user" ? "restaurant" : req.user.role,
    });
  }

  res.status(201).json({
    status: "success",
    data: restaurant,
  });
});

// Get restaurant by id
export const getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.storeId);

  if (!restaurant)
    return next(new ErrorHandler("No Restaurant found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: restaurant,
  });
});

// Update restaurant
export const updateRestaurant = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (req.files && req.files.image) {
    const file = req.files.image;
    // Assuming express-fileupload is used based on foodItemController
    const filename = `${Date.now()}_${file.name.replace(/\\s+/g, "_")}`;
    // Using import path logic
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
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

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.storeId,
    body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant)
    return next(new ErrorHandler("No Restaurant found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: restaurant,
  });
});

// Delete restaurant
export const deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.storeId);

  if (!restaurant)
    return next(new ErrorHandler("No document found with that ID", 404));

  res.status(204).json({
    status: "success",
  });
});

// Add Review to Restaurant
export const addRestaurantReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const storeId = req.params.storeId;

  const restaurant = await Restaurant.findById(storeId);
  if (!restaurant) {
    return next(new ErrorHandler("Restaurant not found", 404));
  }

  const review = {
    name: req.user.name,
    rating: Number(rating),
    Comment: comment,
  };

  restaurant.reviews.push(review);
  restaurant.numOfReviews = restaurant.reviews.length;
  restaurant.ratings =
    restaurant.reviews.reduce((acc, item) => item.rating + acc, 0) /
    restaurant.reviews.length;

  await restaurant.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Review added successfully",
    data: restaurant,
  });
});

export default {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addRestaurantReview,
};
