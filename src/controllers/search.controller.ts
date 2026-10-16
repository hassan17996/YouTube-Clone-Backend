import type { Request, Response } from "express";
import { literal, Op, type Order, type WhereOptions } from "sequelize";
import { matchedData } from "express-validator";
import { User } from "../models/index.js";
import { getPaging } from "../utils/pagination.js";
import { sendVideos, type SortKey } from "./video.controller.js";

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

const endOfDay = (value: string) =>
  value.length === 10 ? new Date(`${value}T23:59:59.999Z`) : new Date(value);

// GET /api/search/videos?q=&sort=&userId=&from=&to=&page=&limit=
export const searchVideos = async (req: Request, res: Response) => {
  // matchedData returns the validated + sanitized values (q is HTML-escaped to match stored titles)
  const { q, userId, from, to } = matchedData(req, { locations: ["query"] });
  const pattern = likePattern(q);

  const conditions: WhereOptions[] = [
    { [Op.or]: [{ title: { [Op.iLike]: pattern } }, { description: { [Op.iLike]: pattern } }] },
  ];
  if (userId) conditions.push({ userId: Number(userId) });

  if (from || to) {
    const range: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
    if (from) range[Op.gte] = new Date(from);
    if (to) range[Op.lte] = endOfDay(to);
    conditions.push({ createdAt: range });
  }

  const sort = (req.query.sort as SortKey) || "latest";
  await sendVideos(req, res, sort, { [Op.and]: conditions });
};

// GET /api/search/channels?q=&sort=popular|name&page=&limit=
const SUBSCRIBERS = `(SELECT COUNT(*)::int FROM subscriptions s WHERE s.channel_id = "User"."id")`;
const VIDEOS = `(SELECT COUNT(*)::int FROM videos v WHERE v.user_id = "User"."id")`;

export const searchChannels = async (req: Request, res: Response) => {
  const { q } = matchedData(req, { locations: ["query"] });
  const { page, limit, offset } = getPaging(req);

  const order: Order =
    req.query.sort === "name"
      ? [["username", "ASC"]]
      : [[literal(SUBSCRIBERS), "DESC"], ["username", "ASC"]];

  const { rows, count } = await User.findAndCountAll({
    where: { username: { [Op.iLike]: likePattern(q) }, isVerified: true },
    attributes: [
      "id", "username", "bio", "profilePicture",
      [literal(SUBSCRIBERS), "subscribersCount"],
      [literal(VIDEOS), "videosCount"],
    ],
    order,
    limit,
    offset,
  });

  res.json({ channels: rows, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};