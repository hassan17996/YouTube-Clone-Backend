

// to Delete File depending on path => like profile picture or video thumbnail
// Delete from uploads folder only
// Delete using full path

import path from "node:path";
import fs from "node:fs";
import type {Request} from 'express';

export const uploadFolder = path.resolve("uploads");       // D:/YouTube-Clone/uploads

export const removeUpload = async (publicPath?: string | null) => {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;

  const fullPath = path.resolve(publicPath.slice(1));       // D:/YouTube-Clone/uploads/avatars/abc.jpg

  if (!fullPath.startsWith(uploadFolder + path.sep)) return; // path-traversal guard
  await fs.promises.unlink(fullPath).catch(() => {});
};

// To delete files when request failed 
// as multer save the file in the folder before body validation for ex.

export const deleteUploaded = async (req: Request) => {
  const files = req.files as
    | Record<string, Express.Multer.File[]>
    | undefined;

  const list: Express.Multer.File[] = [
    ...(req.file ? [req.file] : []),
    ...Object.values(files ?? {}).flat(),
  ];

  await Promise.all(
    list.map((f) =>
      fs.promises.unlink(f.path).catch(() => {})
    )
  );
};