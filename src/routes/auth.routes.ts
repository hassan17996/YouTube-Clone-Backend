import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { check } from "express-validator";

const router = Router();

// POST /api/auth/signup
router.post("/signup",
  check("username")
    .trim()
    .isLength({ min: 3, max: 25 })
    .withMessage("username must be 3-25 characters"),
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  check("password")
    .trim()
    .isLength({ min: 8, max: 40 })
    .withMessage("password must be 8-25 characters"),
  validate,
  signup,
);

// POST /api/auth/verify-otp
router.post("/verify-otp",
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  check("otp").trim().isNumeric().isLength({ min: 6, max: 6 }),
  validate,
  verifyOtp,
);

// POST /api/auth/resend-otp
router.post("/resend-otp",
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  validate,
  resendOtp,
);

// POST /api/auth/login
router.post("/login",
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  check("password").notEmpty(),
  validate,
  login,
);

// POST /api/auth/forgot-password
router.post("/forgot-password",
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  validate,
  forgotPassword,
);


// POST /api/auth/reset-password
router.post("/reset-password",
  check("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  check("otp").trim().isNumeric().isLength({ min: 6, max: 6 }),
  check("newPassword").isLength({ min: 8, max: 40 }).withMessage("Password must be 8-40 characters"),
  validate,
  resetPassword
);

export default router;
