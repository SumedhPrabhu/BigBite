import Coupon from "../models/couponModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const createCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  res.status(200).json({
    status: "success",
    data: coupon,
  });
});

export const getCoupon = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.find();
  res.status(200).json({
    status: "success",
    data: coupons,
  });
});

export const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon)
    return next(new ErrorHandler("No Coupon found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: coupon,
  });
});

export const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
  if (!coupon)
    return next(new ErrorHandler("No coupon found with given Id", 404));

  res.status(204).json({
    status: "success",
  });
});

export const couponValidate = catchAsync(async (req, res, next) => {
  const { couponCode, cartItemsTotalAmount } = req.body;

  const coupon = await Coupon.aggregate([
    {
      $addFields: {
        finalTotal: {
          $cond: [
            { $gte: [cartItemsTotalAmount, "$minAmount"] },
            {
              $subtract: [
                cartItemsTotalAmount,
                {
                  $min: [
                    {
                      $multiply: [
                        cartItemsTotalAmount,
                        { $divide: ["$discount", 100] },
                      ],
                    },
                    "$maxDiscount",
                  ],
                },
              ],
            },
            cartItemsTotalAmount,
          ],
        },
        message: {
          $cond: [
            { $gte: [cartItemsTotalAmount, "$minAmount"] },
            "",
            {
              $concat: [
                "add ₹ ",
                {
                  $toString: {
                    $subtract: ["$minAmount", cartItemsTotalAmount],
                  },
                },
                " more to avail this offer",
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        subTitle: 1,
        couponName: 1,
        details: 1,
        minAmount: 1,
        finalTotal: 1,
        message: 1,
      },
    },
  ]);

  if (!coupon) {
    return next(new ErrorHandler("Invalid coupon code.", 404));
  }

  res.status(200).json({
    status: "success",
    data: coupon,
  });
});

export default {
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  couponValidate,
};
