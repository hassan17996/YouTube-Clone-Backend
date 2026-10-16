import { Subscription, User, Video } from "../models/index.js";
import type { Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { deleteUploaded, removeUpload } from "../utils/files.js";
import { sequelize } from "../utils/db.js";
import { literal, Op, type Order, type WhereOptions } from "sequelize";
import { getPaging } from "../utils/pagination.js";

const LIKES = `(SELECT COUNT(*)::int FROM reactions r WHERE r.video_id = "Video"."id" AND r.type = 'like')`;
const DISLIKES = `(SELECT COUNT(*)::int FROM reactions r WHERE r.video_id = "Video"."id" AND r.type = 'dislike')`;
const COMMENTS = `(SELECT COUNT(*)::int FROM comments c WHERE c.video_id = "Video"."id")`;

const videoAttributes = {
  include: [
    [literal(LIKES), "likesCount"],
    [literal(DISLIKES), "dislikesCount"],
    [literal(COMMENTS), "commentsCount"],
  ] as [ReturnType<typeof literal>, string][],
};

const authorInclude = {
  model: User,
  as: "user",
  attributes: ["id", "username", "bio", "profilePicture"],
};

export type SortKey = "latest" | "views" | "likes" | "trending";

const ORDERS: Record<SortKey, Order> = {
  latest: [["createdAt", "DESC"]],
  views: [
    ["views", "DESC"],
    ["createdAt", "DESC"],
  ],
  likes: [
    [literal(LIKES), "DESC"],
    ["createdAt", "DESC"],
  ],
  trending: [
    [literal(`("Video"."views" + 5 * ${LIKES} - 2 * ${DISLIKES})`), "DESC"],
    ["createdAt", "DESC"],
  ],
};

export const sendVideos = async (req: Request, res: Response, sort: SortKey, where: WhereOptions = {}) => {
    
    const { page, limit, offset } = getPaging(req);
    
    const [videos, total] = await Promise.all([
    Video.findAll({
      where,
      attributes: videoAttributes,
      include: [authorInclude],
      order: ORDERS[sort],
      limit,
      offset,
    }),
    Video.count({ where }),
  ]);

  res.status(200).json({ videos, page, limit, total, totalPages: Math.ceil(total / limit) });
};

export const getVideos = async (req: Request, res: Response) => {
    const sort = (req.query.sort as SortKey) || "latest";
    const where: WhereOptions = req.query.userId ? { userId: Number(req.query.userId) } : {};
    await sendVideos(req,res,sort,where)
};

export const trendingVideos = async (req: Request, res: Response) => {
    const sort = (["views", "likes"].includes(String(req.query.sort)) ? req.query.sort : "trending") as SortKey;
    await sendVideos(req, res, sort);
};

export const getVideo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  await Video.increment("views", { by: 1, where: { id } });

  const video = await Video.findByPk(id, {
    attributes: videoAttributes,
    include: [authorInclude],
  });

  if (!video) throw new HttpError(404, "Video not found");
  res.json({ video });
};

export const subscribedFeed = async (req: Request, res: Response) => {
  const subs = await Subscription.findAll({
    where: { subscriberId: req.user!.id },
    attributes: ["channelId"],
  });
  const channelIds = subs.map((s) => s.channelId);

  if (channelIds.length === 0) {
    res.json({ videos: [], page: 1, limit: 10, total: 0, totalPages: 0 });
    return;
  }
  await sendVideos(req, res, "latest", { userId: { [Op.in]: channelIds } });
};


export const createVideo = async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const videoFile = files?.video?.[0];
  const thumbFile = files?.thumbnail?.[0];

  if (!videoFile) {
    await deleteUploaded(req);
    throw new HttpError(400, "Video file is required (field name: video)");
  }

  try {
    const video = await sequelize.transaction((t) =>
      Video.create(
        {
          title: req.body.title,
          description: req.body.description ?? null,
          videoUrl: `/uploads/videos/${videoFile.filename}`,
          thumbnailUrl: thumbFile
            ? `/uploads/thumbnails/${thumbFile.filename}`
            : null,
          userId: req.user!.id,
        },
        { transaction: t },
      ),
    );

    res.status(201).json({ video });
  } catch (err) {
    await deleteUploaded(req);
    throw err;
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body ?? {};
    const video = await Video.findByPk(Number(req.params.id));

    if (!video) throw new HttpError(404, "Video not found");
    if (video.userId !== req.user!.id)
      throw new HttpError(403, "You can only edit your own videos");

    const changes: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
    } = {};
    if (title !== undefined) changes.title = title;
    if (description !== undefined) changes.description = description;
    if (req.file)
      changes.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;

    const oldThumb = video.thumbnailUrl;
    await sequelize.transaction((t) =>
      video.update(changes, { transaction: t }),
    );
    if (req.file) await removeUpload(oldThumb);

    res.json({ video });
  } catch (err) {
    await deleteUploaded(req);
    throw err;
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  const video = await Video.findByPk(Number(req.params.id));
  if (!video) throw new HttpError(404, "Video not found");
  if (video.userId !== req.user!.id)
    throw new HttpError(403, "You can only delete your own videos");

  await sequelize.transaction((t) => video.destroy({ transaction: t }));

  await Promise.all([
    removeUpload(video.videoUrl),
    removeUpload(video.thumbnailUrl),
  ]);

  res.json({ message: "Video deleted" });
};

