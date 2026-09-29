import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      maxlength: [30, "Name cannot exceed 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Please enter email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Enter valid email"],
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailOTP: String,
    emailOTPExpires: Date,

    password: {
      type: String,
      required: [true, "Enter password"],
      minlength: 6,
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: [true, "Confirm password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not same",
      },
    },

    phoneNumber: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Enter valid phone number"],
    },

    role: {
      type: String,
      enum: ["user", "restaurant", "restaurant-owner", "admin"],
      default: "user",
    },

    avatar: {
      public_id: String,
      url: String,
    },

    deliveryInfo: {
      address: String,
      city: String,
      phoneNo: String,
      postalCode: String,
      country: String,
    },

    savedFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodItem",
      },
    ],

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

// HASH PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// PASSWORD COMPARE
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK IF PASSWORD CHANGED AFTER JWT
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// CREATE JWT TOKEN
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "90d" }
  );
};

// GENERATE OTP
userSchema.methods.generateEmailOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailOTP = crypto.createHash("sha256").update(otp).digest("hex");
  this.emailOTPExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return otp;
};

// PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;