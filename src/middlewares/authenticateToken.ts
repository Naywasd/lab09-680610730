import { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

import type { CustomRequest, UserPayload } from "../libs/types.ts";

const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Bearer token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token is required",
    });
  }

  const jwt_secret =
    process.env.JWT_SECRET || "this_is_my_secret";

  jwt.verify(token, jwt_secret, (err, payload) => {

    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = payload as UserPayload;

    req.token = token;

    next();
  });

};

export default authenticateToken;