import { ForecastDay, ForecastResponse, Temperature, WeatherData } from "./types";

const CONDITIONS: readonly string[] = [
  "Sunny",
  "Partly Cloudy",
  "Cloudy",
  "Overcast",
  "Rainy",
  "Thunderstorm",
  "Snowy",
  "Foggy",
  "Windy",
  "Clear",
];

function hashCity(city: string): number {
  let hash = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < city.length; i++) {
    hash ^= city.toLowerCase().charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

function makeRng(seed: number): () => number {
  let s = seed;
  return (): number => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}

function buildTemperature(rng: () => number): Temperature {
  const celsius = Math.round(rng() * 50 - 5); // -5°C to 45°C
  return { celsius, fahrenheit: toFahrenheit(celsius) };
}

function pickCondition(rng: () => number): string {
  return CONDITIONS[Math.floor(rng() * CONDITIONS.length)];
}

export function getWeather(city: string): WeatherData {
  const rng = makeRng(hashCity(city));
  return {
    city,
    temperature: buildTemperature(rng),
    condition: pickCondition(rng),
    humidity: Math.round(rng() * 60 + 30), // 30–90%
    windKph: Math.round(rng() * 60 + 5),   // 5–65 km/h
  };
}

export function getForecast(city: string): ForecastResponse {
  const seed = hashCity(city);
  const today = new Date();

  const forecast: ForecastDay[] = Array.from({ length: 5 }, (_, i) => {
    const day = i + 1;
    const rng = makeRng((seed + day * 0xdeadbeef) >>> 0);

    const date = new Date(today);
    date.setDate(today.getDate() + day);

    return {
      date: date.toISOString().split("T")[0],
      temperature: buildTemperature(rng),
      condition: pickCondition(rng),
      humidity: Math.round(rng() * 60 + 30),
      windKph: Math.round(rng() * 60 + 5),
    };
  });

  return { city, forecast };
}
