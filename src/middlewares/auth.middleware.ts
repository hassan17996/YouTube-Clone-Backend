import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { HttpError } from "../utils/httpError.js";
import { User } from "../models/user.model.js";

// Verify Jwt Token 
// Add user Into Request
// We need it to protect routes
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new HttpError(401, "Authentication required");

  let token: JwtPayload;
  try {
    token = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET!,
    ) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  // sub refer to subject which contain the id in the controller
  const user = await User.findByPk(Number(token.sub));
  if (!user) throw new HttpError(401, "User not exists");

  req.user = {
    id: user.id,
    username: user.username,
    isVerified: user.isVerified,
  };

  next();
};

// after authenticate on any route we need isVerified = true.
export const requireVerified = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.isVerified) throw new HttpError(403, "Verified account required");
  next();
};
