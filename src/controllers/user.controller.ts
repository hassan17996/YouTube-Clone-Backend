import type { Request, Response } from "express";
import { Subscription, User, Video } from "../models/index.js";
import { HttpError } from "../utils/httpError.js";
import { removeUpload } from "../utils/files.js";
import bcrypt from "bcryptjs";
import { sequelize } from "../utils/db.js";

const userData = (u: User) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  bio: u.bio,
  profilePicture: u.profilePicture,
  isVerified: u.isVerified,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findByPk(req.user!.id);
  if (!user) throw new HttpError(404, "User not found");
  res.status(200).json({ user: userData(user) });
};

export const getUserProfile = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await User.findByPk(id, {
    attributes: ["id", "username", "bio", "profilePicture", "createdAt"],
  });
  if (!user) throw new HttpError(404, "User not found");

  const [videosCount, subscribersCount] = await Promise.all([
    Video.count({ where: { userId: id } }),
    Subscription.count({ where: { channelId: id } }),
  ]);

  res.status(200).json({ user, videosCount, subscribersCount });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { username, bio } = req.body;
  if (username === undefined && bio === undefined)
    throw new HttpError(400, "Nothing to update");

  const user = await User.findByPk(req.user!.id);
  if (!user) throw new HttpError(404, "User not found");

  if (username !== undefined && username !== user.username) {
    const wasTaken = await User.findOne({ where: { username } });
    if (wasTaken) throw new HttpError(409, "Username already taken");
    user.username = username;
  }
  if (bio !== undefined) user.bio = bio;

  await user.save();
  res.json({ user: userData(user) });
};

export const updateAvatar = async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, "Avatar image is required");

  const newPath = `/uploads/avatars/${req.file.filename}`; // ex: /uploads/avatars/a81f3c12-6b7d-4e91-8f20-2c7a1d6e9b40.jpg

  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new HttpError(404, "User not found");

    const oldPath = user.profilePicture;

    await user.update({ profilePicture: newPath });
    await removeUpload(oldPath);
    res.status(200).json({ user: userData(user) });
  } catch (err) {
    await removeUpload(newPath);
    throw err;
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  const { password } = req.body;

  const user = await User.findByPk(req.user!.id);
  if (!user) throw new HttpError(404, "User not found");

  if (!(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Incorrect password");         
  }

  const avatarPath = user.profilePicture;
  const videos = await Video.findAll({
    where: {userId: user.id},
    attributes: ["videoUrl", "thumbnailUrl"]
  })

  await sequelize.transaction((t) => user.destroy({ transaction: t }));
  await Promise.all([
    await removeUpload(avatarPath),
    videos.map(async(video)=> {
      await removeUpload(video.videoUrl);
      await removeUpload(video.thumbnailUrl);
    })
  ])

  res.status(200).json({ message: "Account deleted" });
};
