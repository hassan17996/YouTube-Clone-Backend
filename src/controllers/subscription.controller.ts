import type { Request, Response } from "express";
import { sequelize } from "../utils/db.js";
import { Subscription, User } from "../models/index.js";
import { HttpError } from "../utils/httpError.js";
import { getPaging } from "../utils/pagination.js";

const numberOfSubscribers = async (channelId: number) =>
  await Subscription.count({ where: { channelId } });


// POST /api/subscriptions/:channelId
export const subscribe = async (req: Request, res: Response) => {
  const channelId = Number(req.params.channelId);
  const subscriberId = req.user!.id;
  if (channelId === subscriberId)
    throw new HttpError(400, "You cannot subscribe to yourself");

  try {
    await sequelize.transaction(async (t) => {
      const channel = await User.findByPk(channelId, {
        attributes: ["id"],
        transaction: t,
      });
      if (!channel) throw new HttpError(404, "Channel not found");

      const existing = await Subscription.findOne({
        where: { subscriberId, channelId },
        transaction: t,
      });
      if (existing)
        throw new HttpError(409, "Already subscribed in this channel");

      await Subscription.create(
        { subscriberId, channelId },
        { transaction: t },
      );
    });
  } catch (err) {
    throw err;
  }
  const subscribersCount = await numberOfSubscribers(channelId);
  res.status(201).json({ subscribed: true, subscribersCount });
};

// DELETE /api/subscriptions/:channelId
export const unsubscribe = async (req: Request, res: Response) => {
  const channelId = Number(req.params.channelId);

  const removed = await sequelize.transaction((t) =>
    Subscription.destroy({
      where: { subscriberId: req.user!.id, channelId },
      transaction: t,
    }),
  );
  if (removed === 0) throw new HttpError(404, "You are not subscribed to this channel");

  const subscribersCount = await numberOfSubscribers(channelId);
  res.status(201).json({ subscribed: false, subscribersCount });
};

// GET /api/subscriptions   (channels I follow)
export const listSubscriptions = async (req: Request, res: Response) => {
  const { page, limit, offset } = getPaging(req);

  const [subscriptions, total] = await Promise.all([
    Subscription.findAll({
        where: {subscriberId: req.user!.id},
        order: [["createdAt", "DESC"]],
        include: [{model: User, as: "channel", attributes: ["username", "bio"]}],
        limit,
        offset,
    }),
    Subscription.count({where: {subscriberId: req.user!.id}})
  ]);

  res.status(200).json({ subscriptions, page, limit, total, totalPages: Math.ceil(total / limit)});
};


// GET /api/subscriptions/:channelId/status
export const subscriptionStatus = async (req: Request, res: Response) => {
  const channelId = Number(req.params.channelId);
  const existing = await Subscription.findOne({ where: { subscriberId: req.user!.id, channelId } });
  res.json({ subscribed: Boolean(existing), subscribersCount: await numberOfSubscribers(channelId) });
};