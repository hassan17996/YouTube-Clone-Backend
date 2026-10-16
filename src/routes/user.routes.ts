import { Router } from "express";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import {
    deleteAccount,
  getMe,
  getUserProfile,
  updateAvatar,
  updateProfile,
} from "../controllers/user.controller.js";
import { validate } from "../middlewares/validate.js";
import { check } from "express-validator";
import { uploadAvatar } from "../middlewares/upload.middleware.js";

const router = Router();

// GET /api/users/me
router.get("/me", authenticate, getMe);

// GET /api/users/:id
router.get("/:id", getUserProfile);        // still need testing

// PUT /api/users/me
router.put("/me",
    authenticate,
    requireVerified,
    
    check("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 25 })
    .withMessage("username must be 3-25 characters"),
    check("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio max 500 characters"),

    validate,
    updateProfile,
);

// PUT /api/users/me/avatar
router.put("/me/avatar", authenticate, requireVerified, uploadAvatar, updateAvatar);

// DELETE /api/users/me
router.delete("/me",
  authenticate,
  requireVerified,
  check("password").notEmpty().withMessage("Password required"),
  validate,
  deleteAccount
);

export default router;
