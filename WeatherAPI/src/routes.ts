import { Router, Request, Response } from "express";
import { getForecast, getWeather } from "./weather";
import { ForecastResponse, HealthResponse, WeatherData } from "./types";
import { renderDashboard } from "./dashboard";

const router = Router();

const CITY_RE = /^[\w\s\-.']{1,100}$/;

function parseCity(raw: string): { ok: true; city: string } | { ok: false; error: string } {
  if (!CITY_RE.test(raw)) {
    return { ok: false, error: "City must be 1–100 characters and contain only letters, spaces, hyphens, apostrophes, or periods" };
  }
  return { ok: true, city: raw };
}

router.get("/", (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderDashboard());
});

router.get("/health", (_req: Request, res: Response<HealthResponse>): void => {
  res.json({ status: "ok" });
});

router.get("/weather/:city", (req: Request, res: Response<WeatherData | { error: string }>): void => {
  const parsed = parseCity(req.params.city);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  res.json(getWeather(parsed.city));
});

router.get("/forecast/:city", (req: Request, res: Response<ForecastResponse | { error: string }>): void => {
  const parsed = parseCity(req.params.city);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  res.json(getForecast(parsed.city));
});

export default router;
