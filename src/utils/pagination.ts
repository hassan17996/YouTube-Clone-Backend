import type { Request } from "express";

export const getPaging = (req: Request) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};