import multer from "multer";
import { deleteUploaded, uploadFolder } from "../utils/files.js";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { HttpError } from "../utils/httpError.js";
import type { Request, Response, NextFunction } from "express";

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};


export const makeUploader = (
  folder: string,
  allowed: Record<string, string>,
  maxBytes: number,
) => {
  const dir = path.join(uploadFolder, folder);
  fs.mkdirSync(dir, { recursive: true });

  // return middleware from multer
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) =>
        cb(null, `${crypto.randomUUID()}${allowed[file.mimetype]}`),
    }),

    fileFilter: (req, file, cb) => {
      if (!allowed[file.mimetype])
        return cb(new HttpError(400, "Unsupported file type"));
      cb(null, true);
    },

    limits: { files: 1, fileSize: maxBytes },
  });
};

// to use this middleware in routes
export const uploadAvatar = makeUploader(
  "avatars",
  IMAGE_TYPES,
  2 * 1024 * 1024,
).single("avatar");

// ====================================================

export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const VIDEO_MAX = 100 * 1024 * 1024; 
const THUMB_MAX = 2 * 1024 * 1024;

const VIDEO_DIR = path.join(uploadFolder, "videos");
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const THUMB_DIR = path.join(uploadFolder, "thumbnails");
fs.mkdirSync(THUMB_DIR, { recursive: true });

const typesFor = (field: string): Record<string, string> =>
  field === "video" ? VIDEO_TYPES : IMAGE_TYPES;

const videoStorage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, file.fieldname === "video" ? VIDEO_DIR : THUMB_DIR),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${typesFor(file.fieldname)[file.mimetype]}`),
});

// Video + optional thumbnail in one request
export const uploadVideoFiles = multer({
  storage: videoStorage,
  limits: { fileSize: VIDEO_MAX, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!typesFor(file.fieldname)[file.mimetype]) {
      return cb(new HttpError(400, 'Unsupported file type'));
    }
    cb(null, true);
  },
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

// Thumbnail only (video update)
export const uploadThumbnail = makeUploader("thumbnails", IMAGE_TYPES, THUMB_MAX).single("thumbnail");

// Multer has one size limit per uploader, so I check the thumbnail separately
export const enforceThumbnailSize = async (req: Request, _res: Response, next: NextFunction) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const thumb = files?.thumbnail?.[0];
  if (thumb && thumb.size > THUMB_MAX) {
    await deleteUploaded(req);
    throw new HttpError(400, "Thumbnail too large (max 2 MB)");
  }
  next();
};