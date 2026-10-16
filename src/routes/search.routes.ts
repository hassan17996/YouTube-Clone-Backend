import { Router } from "express";
import { query } from "express-validator";
import { searchVideos, searchChannels } from "../controllers/search.controller.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const qRule = query("q").trim().isLength({ min: 1, max: 100 }).withMessage("q is required (1-100 characters)");

const pagingRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];

router.get("/videos",

  qRule,
  ...pagingRules,
  query("sort").optional().isIn(["latest", "views", "likes", "trending"]),
  query("userId").optional().isInt({ min: 1 }),
  query("from").optional().isISO8601().withMessage("from must be a date, e.g. 2026-10-01"),
  query("to").optional().isISO8601().withMessage("to must be a date, e.g. 2026-10-31"),

  validate,
  searchVideos
);

router.get("/channels",

  qRule,
  ...pagingRules,
  query("sort").optional().isIn(["popular", "name"]),

  validate,
  searchChannels
);

export default router;