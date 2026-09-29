import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors";

import aiRoutes from "./routes/ai.routes.js";
import errorMiddleware from "./middlewares/errors.js";

import foodRouter from "./routes/foodItem.js";
import restaurant from "./routes/restaurant.js";
import coupon from "./routes/couponRoutes.js";
import order from "./routes/order.js";
import auth from "./routes/auth.js";
import payment from "./routes/payment.js";
import cart from "./routes/cart.js";
import reelRoutes from "./routes/reelRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:4000"
      ];
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(fileUpload());

// API Routes
// Auth — mounted at /api/v1/users so routes are /api/v1/users/signup, /login, /me etc.
app.use("/api/v1/users", auth);

// Restaurants
app.use("/api/v1/eats/stores", restaurant);

// Food items
app.use("/api/v1/eats", foodRouter);

// Orders
app.use("/api/v1/eats/orders", order);

// Payment
app.use("/api/v1", payment);

// Coupons
app.use("/api/v1/coupon", coupon);

// Cart
app.use("/api/v1/eats/cart", cart);

// AI
app.use("/api/v1/ai", aiRoutes);

// Reels Discovery & Recommendations
app.use("/api/v1/reels", reelRoutes);
app.use("/api/v1/eats/reels", reelRoutes);

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "view"));

app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

app.use(errorMiddleware);

export default app;
