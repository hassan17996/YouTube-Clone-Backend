import { Router } from "express";
import { param, check } from "express-validator";
import {
  subscribe, unsubscribe, listSubscriptions, subscriptionStatus,
} from "../controllers/subscription.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();
const channelRule = param("channelId").isInt({ min: 1 });

// GET /api/subscriptions 
router.get("/",
  authenticate,
  check("page").optional().isInt({ min: 1 }),
  check("limit").optional().isInt({ min: 1, max: 50 }),
  validate,
  listSubscriptions
);

// GET /api/subscriptions/:channelId/status
router.get("/:channelId/status", 
    authenticate, 
    channelRule, 
    validate, 
    subscriptionStatus
);

// POST /api/subscriptions/:channelId
router.post("/:channelId", 
    authenticate, 
    requireVerified, 
    channelRule, 
    validate, 
    subscribe
);

// DELETE /api/subscriptions/:channelId
router.delete("/:channelId", 
    authenticate, 
    requireVerified, 
    channelRule, 
    validate, 
    unsubscribe
);

export default router;