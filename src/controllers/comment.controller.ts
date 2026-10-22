import { Comment, User, Video } from "../models/index.js";
import type { Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { deleteUploaded, removeUpload } from "../utils/files.js";
import { sequelize } from "../utils/db.js";
import { getPaging } from "../utils/pagination.js";

const authorInclude = {
  model: User,
  as: "user",
  attributes: ["id", "username", "profilePicture"],
};

// GET /api/videos/:videoId/comments      ==> in videos routes
export const listVideoComments = async (req: Request, res: Response) => {
  const { page, limit, offset } = getPaging(req);

  const videoId = Number(req.params.videoId);
  const video = await Video.findByPk(videoId, { attributes: ["id", "title"] });
  if (!video) throw new HttpError(404, "Video not found");

  const [comments, total] = await Promise.all([
    await Comment.findAll({
      where: { videoId: video.id },
      include: [authorInclude],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    }),
    await Comment.count({ where: {videoId: video.id} }),
  ]);

  res.status(200).json({
    comments,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

// POST /api/videos/:videoId/comments     ==> in videos routes
export const createComment = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId);

  const created = await sequelize.transaction(async (t) => {
    const video = await Video.findByPk(videoId, {
      attributes: ["id", "title"],
    });
    if (!video) throw new HttpError(404, "Video not found");

    return Comment.create(
      { content: req.body.content, userId: req.user!.id, videoId },
      { transaction: t },
    );
  });

  const comment = await Comment.findByPk(created.id, {
    include: [authorInclude],
  });
  res.status(201).json({ comment });
};

// GET /api/comments/:id
export const getComment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const comment = await Comment.findByPk(id, { include: [authorInclude] });
  if (!comment) throw new HttpError(404, "Comment not found");
  res.status(200).json({ comment });
};

// PUT /api/comments/:id
export const updateComment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const comment = await Comment.findByPk(id);
  if (!comment) throw new HttpError(404, "Comment not found");

  if (req.user?.id !== comment.userId)
    throw new HttpError(403, "You can only edit your own comments");

  comment.update({ content: req.body.content });
  res.status(200).json({ message: "updated successfully", comment });
};

// DELETE /api/comments/:id  (author or the video's creator)
export const deleteComment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const comment = await Comment.findByPk(id);
  if (!comment) throw new HttpError(404, "Comment not found");

  const video = await Video.findByPk(comment.videoId, { attributes: ["userId"] });
  const isAuthor = comment.userId === req.user!.id;
  const isVideoOwner = video?.userId === req.user!.id;
  if (!isAuthor && !isVideoOwner) {
    throw new HttpError(403, "Only the comment author or the video creator can delete this comment");
  }

  await sequelize.transaction((t) => comment.destroy({ transaction: t }));
  res.json({ message: "Comment deleted" });
};
