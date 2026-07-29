import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.ts";

// import database
import { users, reset_users } from "../db/db.ts";

import authenticateToken from "../middlewares/authenticateToken.ts";

import { zUserLoginBody } from "../libs/zodValidators.ts";

const router = Router();

// GET /api/v2/users
router.get("/",authenticateToken,(req: CustomRequest, res: Response) => {
  try {

    const user_payload = req.user;

    const user = users.find((u) => u.username === user_payload?.username);

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
  try {

    const body = req.body;

    const validationResult =
      zUserLoginBody.safeParse(body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });
    }

    const foundUser = users.find(
      (u) =>
        u.username === body.username &&
        u.password === body.password
    );

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const jwt_secret =
      process.env.JWT_SECRET || "this_is_my_secret";

    const token = jwt.sign(
      {
        username: foundUser.username,
        studentId: foundUser.studentId,
        role: foundUser.role,
      },
      jwt_secret,
      {
        expiresIn: "30m",
      }
    );

    if (!foundUser.tokens) {
      foundUser.tokens = [];
    }

    foundUser.tokens.push(token);

    return res.status(200).json({
      success: true,
      token,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong",
      error: err,
    });
  }
});


// POST /api/v2/users/logout
router.post("/logout", (req: Request, res: Response) => {
  try {
    
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
        message: "Invalid Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    const jwt_secret =
      process.env.JWT_SECRET || "this_is_my_secret";

    jwt.verify(token, jwt_secret, (err, payload) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      const userPayload = payload as UserPayload;

      const foundUser = users.find(
        (u) => u.username === userPayload.username
      );

      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (foundUser.tokens) {
        foundUser.tokens = foundUser.tokens.filter(
          (t) => t !== token
        );
      }

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;