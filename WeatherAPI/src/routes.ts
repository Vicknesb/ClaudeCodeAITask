import { Router, Request, Response, NextFunction } from "express";
import { getForecast, getWeather } from "./weather";
import { ForecastResponse, HealthResponse, WeatherData } from "./types";
import { renderDashboard } from "./dashboard";
import { Errors } from "./errors";

const router = Router();

const CITY_RE = /^[\w\s\-.']{1,100}$/;

function validateCity(raw: string): string {
  if (!CITY_RE.test(raw)) {
    throw Errors.badRequest(
      "City must be 1–100 characters and contain only letters, spaces, hyphens, apostrophes, or periods"
    );
  }
  return raw;
}

router.get("/", (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderDashboard());
});

router.get("/health", (_req: Request, res: Response<HealthResponse>): void => {
  res.json({ status: "ok" });
});

router.get("/weather/:city", (req: Request, res: Response<WeatherData>, next: NextFunction): void => {
  try {
    res.json(getWeather(validateCity(req.params.city)));
  } catch (err) {
    next(err);
  }
});

router.get("/forecast/:city", (req: Request, res: Response<ForecastResponse>, next: NextFunction): void => {
  try {
    res.json(getForecast(validateCity(req.params.city)));
  } catch (err) {
    next(err);
  }
});

export default router;
