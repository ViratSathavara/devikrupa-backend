import { NextFunction, Request, Response } from "express";
import { normalizeLanguage } from "../services/languageDetection.service";

export const languageMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const headerLanguage = req.headers["x-language"];
  const queryLanguage = req.query.lang;

  const rawLanguage =
    (Array.isArray(headerLanguage) ? headerLanguage[0] : headerLanguage) ??
    (Array.isArray(queryLanguage) ? queryLanguage[0] : queryLanguage);

  req.requestedLanguage = normalizeLanguage(rawLanguage, "en");
  next();
};
