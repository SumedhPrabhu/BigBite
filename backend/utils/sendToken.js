import jwt from "jsonwebtoken";

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "PRODUCTION" || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes("vercel.app"));
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (Number(process.env.JWT_EXPIRES_TIME) || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

export default sendToken;