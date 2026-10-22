import { Router } from "express";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import { createVideo, deleteVideo, getVideo, getVideos, subscribedFeed, trendingVideos, updateVideo } from "../controllers/video.controller.js";
import { check, param } from "express-validator";
import { validate } from "../middlewares/validate.js";
import { enforceThumbnailSize, uploadThumbnail, uploadVideoFiles } from "../middlewares/upload.middleware.js";
import { createComment, listVideoComments } from "../controllers/comment.controller.js";
import { getMyReaction, reactToVideo, removeReaction } from "../controllers/reaction.controller.js";

const router = Router();


const paginationRules = [
  check("page").optional().isInt({ min: 1 }),
  check("limit").optional().isInt({ min: 1, max: 50 }),
];

const idRule = check("id").isInt({ min: 1 });
const titleRule = check("title").trim().isLength({ min: 1, max: 255 }).withMessage("Title is 1-255 characters");
const descriptionRule = check("description").optional().trim().isLength({ max: 5000 });

// GET /api/videos/
router.get("/",
    ...paginationRules,
    check("sort").optional().isIn(["latest", "views", "likes", "trending"]),
    check("userId").optional().isInt({ min: 1 }),
    validate,
    getVideos
);

// GET /api/videos/trending
router.get("/trending",
    ...paginationRules,
    check("sort").optional().isIn(["latest", "views", "likes", "trending"]),
    validate,
    trendingVideos
);

// GET /api/videos/subscribed
router.get("/subscribed",
    authenticate, 
    ...paginationRules, 
    validate,
    subscribedFeed
);

// GET /api/videos/:id
router.get("/:id",
    idRule,
    validate,
    getVideo
);

// POST /api/videos/
router.post("/",
    authenticate,
    requireVerified,
    uploadVideoFiles,
    enforceThumbnailSize,

    titleRule,
    descriptionRule,

    validate,
    createVideo
);

// PUT /api/videos/:id
router.put("/:id",

    authenticate,
    requireVerified,
    uploadThumbnail,

    idRule,
    titleRule,
    descriptionRule,

    validate,
    updateVideo
)

// DELETE /api/videos/:id
router.delete("/:id", 
    authenticate,
    requireVerified,

    idRule,
    validate,
    deleteVideo
);



// =============================Comments Routes==================
const videoIdRule = param("videoId").isInt({ min: 1 });

// GET /api/videos/:videoId/comments 
router.get("/:videoId/comments",

    videoIdRule,
    ...paginationRules,

    validate,
    listVideoComments
);

// POST /api/videos/:videoId/comments 
router.post("/:videoId/comments",
    authenticate,
    requireVerified,

    videoIdRule,
    check("content").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment is 1-1000 characters"),

    validate,
    createComment
);



// =============================Reactions Routes==================

// POST /api/videos/:videoId/reactions 
router.post("/:videoId/reactions",
    authenticate,
    requireVerified,

    videoIdRule,
    check("type").isIn(["like", "dislike"]).withMessage("type must be 'like' or 'dislike'"),

    validate,
    reactToVideo
);

// DELETE /api/videos/:videoId/reactions
router.delete("/:videoId/reactions",
    authenticate,
    requireVerified,

    videoIdRule,

    validate,
    removeReaction
);

// GET /api/videos/:videoId/reactions/me 
router.get("/:videoId/reactions/me", 
    authenticate, 
    videoIdRule, 
    validate, 
    getMyReaction
);

export default router;