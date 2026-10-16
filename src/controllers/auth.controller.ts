import type { Request, Response } from "express";
import { User } from "../models/index.js";
import { Op } from "sequelize";
import { HttpError } from "../utils/httpError.js";
import bcrypt from "bcryptjs";
import { sequelize } from "../utils/db.js";
import { consumeOtp, createOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/email.js";
import jwt, { type SignOptions } from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new HttpError(
      400,
      existingUser.email === email
        ? "Email already taken"
        : "Username already taken",
    );
  }

  const hashedPassword = (await bcrypt.hash(password, 10)).toString();

  // Transaction => user,OTP are created together
  const code = await sequelize.transaction(async (t) => {
    await User.create(
      {
        username,
        email,
        password: hashedPassword,
      },
      { transaction: t },
    );
    return createOtp(email, "signup", t);
  });

  await sendOtpEmail(email, code, "Verify Your Email");
  res
    .status(201)
    .json({ message: "Signup successful. Check your email for the OTP." });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw new HttpError(400, "Invalid OTP");
  if (user.isVerified) throw new HttpError(400, "Account already verified");

  await sequelize.transaction(async (t) => {
    await consumeOtp(email, "signup", otp, t);
    await user.update({ isVerified: true }, { transaction: t });
  });

  res.json({ message: "Email verified. You can now log in." });
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user && !user.isVerified) {
    const code = await sequelize.transaction((t) =>
      createOtp(email, "signup", t),
    );
    await sendOtpEmail(email, code, "Verify Your Email");
  }
  res.json({ message: "A new OTP was sent." });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.isVerified)
    throw new HttpError(403, "Please verify your email first");

  const token = jwt.sign({}, process.env.JWT_SECRET!, {
    subject: String(user.id),
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as NonNullable<
      SignOptions["expiresIn"]
    >,
    // NonNullable => to tell ts here expiresIn will be string not undefined
  });

  res.status(200).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio
    }
  })
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    const code = await sequelize.transaction((t) => createOtp(email, "reset_password", t));
    await sendOtpEmail(email, code, "Reset your password");
  }

  res.json({ message: "OTP was sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw new HttpError(400, "OTP expired or not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await sequelize.transaction(async (t) => {
    await consumeOtp(email, "reset_password", otp, t);
    await user.update({ password: hashedPassword }, { transaction: t });
  });

  res.json({ message: "Password reset. You can now log in." });
};