import ErrorHandler from "../utils/errorHandler.js";

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    message = `Resource not found. Invalid: ${err.path}`;
    statusCode = 400;
  }

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((value) => value.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "Account";
    message = `An account with that ${field} already exists. Please login instead.`;
    statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    message = "JSON Web Token is invalid. Please log in again.";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "JSON Web Token is expired. Please log in again.";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errMessage: message,
    stack: process.env.NODE_ENV === "DEVELOPMENT" ? err.stack : undefined,
  });
};

export default errorMiddleware;
