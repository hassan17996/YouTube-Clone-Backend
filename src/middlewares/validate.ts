import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { deleteUploaded } from "../utils/files.js";

export const validate = async (req: Request, res: Response, next: NextFunction) => {
  const errorsArray = validationResult(req);

  if (!errorsArray.isEmpty()) {

    await deleteUploaded(req)
    res.status(400).json({ message: "Validation failed", errors: errorsArray.array() });

    return;
  }
  next();
};
