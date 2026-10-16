import { Reaction, User, Video } from "../models/index.js";
import type { Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { deleteUploaded, removeUpload } from "../utils/files.js";
import { sequelize } from "../utils/db.js";
import { getPaging } from "../utils/pagination.js";
import { where } from "sequelize";

type ReactionType = "like" | "dislike";

const getCounts = async (videoId: number) => {
  const [likesCount, dislikesCount] = await Promise.all([
    Reaction.count({ where: { type: "like", videoId } }),
    Reaction.count({ where: { type: "like", videoId } }),
  ]);
  return { likesCount, dislikesCount };
};

// POST /api/videos/:videoId/reactions   body: { "type": "like" | "dislike" }
export const reactToVideo = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId);
  const type = req.body.type as ReactionType;

  let reaction: ReactionType | null;
  try {
    reaction = await sequelize.transaction(async (t) => {
      const video = await Video.findByPk(videoId, {
        attributes: ["id"],
        transaction: t,
      });

      if (!video) throw new HttpError(404, "Video not found");

      const existingReaction = await Reaction.findOne({
        where: { videoId, type, userId: req.user!.id },
        transaction: t,
      });

      if (!existingReaction) {
        await Reaction.create(
          { userId: req.user!.id, videoId, type },
          { transaction: t },
        );
        return type;
      }

      if (existingReaction.type === type) {
        await existingReaction.destroy({ transaction: t });
        return null;
      }
      await existingReaction.update({ type }, { transaction: t });
      return type;
    });
  } catch (err) {
    throw err;
  }
  const { likesCount, dislikesCount } = await getCounts(videoId);
  res.json({ reaction, likesCount, dislikesCount });
};

// DELETE /api/videos/:videoId/reactions
export const removeReaction = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId);
  const video = await Video.findByPk(videoId);
  if (!video) throw new HttpError(404, "Video not found");

  const removed = await sequelize.transaction((t) => 
    Reaction.destroy({ where: { userId: req.user!.id, videoId }, transaction: t })
  );

  // destroy return the number of rows destroyed
  if (removed === 0) throw new HttpError(404, "No reaction to remove");
    const { likesCount, dislikesCount } = await getCounts(videoId);
  res.status(200).json({ message: "deleted successfully", likesCount, dislikesCount });
};

// GET /api/videos/:videoId/reactions/me 
export const getMyReaction = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId);
  const existing = await Reaction.findOne({ where: { userId: req.user!.id, videoId } });
  res.json({ reaction: existing?.type ?? null });
};