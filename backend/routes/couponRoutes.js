import express from "express";
const router = express.Router();

import {
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  couponValidate,
} from "../controllers/couponController.js";

router.route("/").get(getCoupon).post(createCoupon);
router.route("/validate").post(couponValidate);
router.route("/:couponId").put(updateCoupon).delete(deleteCoupon);

export default router;
