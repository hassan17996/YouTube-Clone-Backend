import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Transaction } from "sequelize";
import { Otp } from "../models/index.js";
import { HttpError } from "./httpError.js";

const otpTimeInMs = 5 * 60 * 1000;
export type OtpType = "signup" | "reset_password";

// Creates a new OTP (replacing any old one) and returns the plain code to email.
export const createOtp = async (
  email: string,
  type: OtpType,
  t: Transaction,
) => {
  const code = crypto.randomInt(100000, 1000000).toString();
  const hashedCode = (await bcrypt.hash(code, 10)).toString();

  await Otp.destroy({ where: { email, type }, transaction: t });
  await Otp.create(
    {
      email,
      type,
      otp: hashedCode,
      expiresAt: new Date(Date.now() + otpTimeInMs),
    },
    { transaction: t },
  );

  return code;
};

// Checks the code and deletes the record so it can't be reused anymore
export const consumeOtp = async (
  email: string,
  type: OtpType,
  code: string,
  t: Transaction,
) => {
  const record = await Otp.findOne({
    where: { email, type },
    order: [["id", "DESC"]],
    transaction: t,
  });

  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "OTP expired or not found");
  }
  if (!(await bcrypt.compare(code, record.otp))) {
    throw new HttpError(400, "Invalid OTP");
  }
  await record.destroy({ transaction: t });
};
