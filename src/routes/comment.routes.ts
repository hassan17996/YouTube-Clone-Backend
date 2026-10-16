import { Router } from "express";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import { check, param } from "express-validator";
import { validate } from "../middlewares/validate.js";
import { deleteComment, getComment, updateComment } from "../controllers/comment.controller.js";

const router = Router();
const idRule = param("id").isInt({ min: 1 });

// GET /api/comments/:id
router.get("/:id", idRule, validate, getComment);

// PUT /api/comments/:id
router.put("/:id",
  authenticate,
  requireVerified,
  idRule,
  check("content").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment is 1-1000 characters"),
  validate,
  updateComment
);

// DELETE /api/comments/:id
router.delete("/:id", authenticate, requireVerified, idRule, validate, deleteComment);

export default router