import crypto from "crypto";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import cloudinary from "cloudinary";

import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Email, sendEmail } from "../utils/email.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import sendToken from "../utils/sendToken.js";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export const otpCache = new Map(); // In-memory cache for pending registrations

// Register user — step 1: initialize account & send OTP
export const signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, passwordConfirm, phoneNumber, role, restaurantId } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email is already registered", 400));
  }

  let avatar = { public_id: "default", url: "/images/default_avatar.jpg" };

  if (
    req.body.avatar &&
    req.body.avatar !== "/images/images.png" &&
    req.body.avatar !== "/images/default_avatar.jpg"
  ) {
    // Check base64 size
    const base64Size = Buffer.byteLength(req.body.avatar, "utf8");
    if (base64Size > MAX_AVATAR_SIZE) {
      return next(new ErrorHandler("Avatar image must be under 2MB. Please choose a smaller file.", 400));
    }

    try {
      const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
      avatar = { public_id: result.public_id, url: result.secure_url };
    } catch (e) {
      console.log("Cloudinary upload skipped:", e.message);
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const emailOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in cache
  otpCache.set(email.toLowerCase(), {
    name,
    email: email.toLowerCase(),
    password,
    passwordConfirm,
    phoneNumber,
    role: role || "user",
    restaurantId: restaurantId || undefined,
    avatar,
    emailOTP: hashedOTP,
    emailOTPExpires,
  });

  try {
    await sendEmail({
      email,
      subject: "Snackr — Verify Your Email (OTP)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 16px; background: #fff;">
          <h1 style="color: #059669; text-align: center; margin: 0 0 8px;">Snackr</h1>
          <p style="text-align: center; color: #6b7280; font-size: 14px;">Email Verification</p>
          <p style="font-size: 15px; color: #111827;">Hi <strong>${name.split(" ")[0]}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563;">Your OTP for email verification is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669; background: #ecfdf5; padding: 12px 28px; border-radius: 12px; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.log("OTP email error (non-fatal):", emailErr.message);
  }

  res.status(200).json({
    success: true,
    message: "OTP sent to your email. Please verify to create your account.",
  });
});

// Verify Email OTP and Create User
export const verifyEmailOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new ErrorHandler("Please provide email and OTP", 400));

  const cachedUser = otpCache.get(email.toLowerCase());
  
  if (!cachedUser || cachedUser.emailOTPExpires < Date.now()) {
    return next(new ErrorHandler("Invalid or expired OTP. Please request a new one.", 400));
  }

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOTP !== cachedUser.emailOTP) {
    return next(new ErrorHandler("Incorrect OTP", 400));
  }

  // OTP verified, create user in DB!
  const user = await User.create({
    name: cachedUser.name,
    email: cachedUser.email,
    password: cachedUser.password,
    passwordConfirm: cachedUser.passwordConfirm,
    phoneNumber: cachedUser.phoneNumber,
    role: cachedUser.role,
    restaurantId: cachedUser.restaurantId,
    avatar: cachedUser.avatar,
    emailVerified: true,
  });

  // Clear cache
  otpCache.delete(email.toLowerCase());

  // Send welcome email
  try {
    const url = process.env.FRONTEND_URL || "http://localhost:5173";
    await new Email(user, url).sendWelcome();
  } catch (e) {
    console.log("Welcome email error (non-fatal):", e.message);
  }

  // Issue token and login
  sendToken(user, 201, res);
});

// Resend OTP
export const resendOTP = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please provide email", 400));

  // Check if user is already in DB (already verified)
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(200).json({ success: true, message: "Email is already verified" });
  }

  const cachedUser = otpCache.get(email.toLowerCase());
  if (!cachedUser) {
    return next(new ErrorHandler("Registration session expired. Please sign up again.", 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  
  cachedUser.emailOTP = hashedOTP;
  cachedUser.emailOTPExpires = Date.now() + 10 * 60 * 1000;
  otpCache.set(email.toLowerCase(), cachedUser);

  try {
    await sendEmail({
      email: cachedUser.email,
      subject: "Snackr — Your New Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 16px; background: #fff;">
          <h1 style="color: #059669; text-align: center;">Snackr</h1>
          <p style="text-align: center; font-size: 14px; color: #6b7280;">New Verification OTP</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669; background: #ecfdf5; padding: 12px 28px; border-radius: 12px; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Valid for 10 minutes.</p>
        </div>
      `,
    });
  } catch (e) {
    return next(new ErrorHandler("Failed to send OTP email. Try again later.", 500));
  }

  res.status(200).json({ success: true, message: "New OTP sent to your email" });
});

// Login
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  const user = await User.findOne({ email })
    .select("+password")
    .populate("savedFoods");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await user.correctPassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 200, res);
});

// Protect Route
export const protect = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new ErrorHandler("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id).populate("savedFoods");

  if (!currentUser) {
    return next(new ErrorHandler("User no longer exists. Please login again.", 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new ErrorHandler("User recently changed password! Please log in again.", 404));
  }

  req.user = currentUser;
  next();
});

// Authorize roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403)
      );
    }
    next();
  };
};

// Get profile
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("savedFoods");

  res.status(200).json({
    success: true,
    user,
  });
});

// Save Food Item
export const saveFoodItem = catchAsyncErrors(async (req, res, next) => {
  const { foodId } = req.params;

  const user = await User.findById(req.user.id);
  if (!user.savedFoods.includes(foodId)) {
    user.savedFoods.push(foodId);
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    message: "Food item saved successfully",
    savedFoods: user.savedFoods,
  });
});

// Remove Saved Food Item
export const removeSavedFoodItem = catchAsyncErrors(async (req, res, next) => {
  const { foodId } = req.params;

  const user = await User.findById(req.user.id);
  user.savedFoods = user.savedFoods.filter(
    (id) => id.toString() !== foodId.toString()
  );
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Food item removed from saved foods",
    savedFoods: user.savedFoods,
  });
});

// Get Saved Food Items
export const getSavedFoods = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("savedFoods");

  res.status(200).json({
    success: true,
    savedFoods: user.savedFoods || [],
  });
});

// Update Password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  const isMatched = await user.correctPassword(oldPassword, user.password);

  if (!isMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Update Profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.body.deliveryInfo) {
    try {
      newUserData.deliveryInfo = typeof req.body.deliveryInfo === "string" 
        ? JSON.parse(req.body.deliveryInfo) 
        : req.body.deliveryInfo;
    } catch (e) {
      newUserData.deliveryInfo = req.body.deliveryInfo;
    }
  }

  if (req.body.avatar && req.body.avatar !== "") {
    // Check base64 size
    const base64Size = Buffer.byteLength(req.body.avatar, "utf8");
    if (base64Size > MAX_AVATAR_SIZE) {
      return next(new ErrorHandler("Avatar image must be under 2MB. Please choose a smaller file.", 400));
    }

    try {
      const user = await User.findById(req.user.id);
      const image_id = user.avatar?.public_id;

      if (image_id && image_id !== "default") {
        await cloudinary.v2.uploader.destroy(image_id);
      }

      const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });

      newUserData.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (e) {
      console.error("Cloudinary upload skipped/failed:", e.message);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  }).populate("savedFoods");

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("There is no user with that email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${process.env.FRONTEND_URL}/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorHandler("There was an error sending the email, try again later!", 500)
    );
  }
});

// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Logout
export const logout = catchAsyncErrors(async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "PRODUCTION" || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes("vercel.app"));
  
  res.cookie("jwt", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

export default {
  signup,
  login,
  protect,
  authorizeRoles,
  getUserProfile,
  saveFoodItem,
  removeSavedFoodItem,
  getSavedFoods,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmailOTP,
  resendOTP,
};