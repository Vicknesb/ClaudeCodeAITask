import { WeatherData } from "./types";
import { getWeather } from "./weather";

const CITIES = ["London", "Tokyo", "New York", "Sydney", "Paris"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMOJI: Record<string, string> = {
  "Sunny":          "☀️",
  "Partly Cloudy":  "⛅",
  "Cloudy":         "☁️",
  "Overcast":       "🌥️",
  "Rainy":          "🌧️",
  "Thunderstorm":   "⛈️",
  "Snowy":          "❄️",
  "Foggy":          "🌫️",
  "Windy":          "💨",
  "Clear":          "🌙",
};

function conditionEmoji(condition: string): string {
  return EMOJI[condition] ?? "🌡️";
}

function card(w: WeatherData): string {
  const emoji = conditionEmoji(w.condition);
  const tempColor = w.temperature.celsius >= 30
    ? "#f97316"
    : w.temperature.celsius <= 0
      ? "#93c5fd"
      : "#38bdf8";

  return `
    <div class="card">
      <div class="card-top">
        <span class="city">${escapeHtml(w.city)}</span>
        <span class="emoji">${emoji}</span>
      </div>
      <div class="temp" style="color:${tempColor}">
        ${w.temperature.celsius}°C
        <span class="temp-f">${w.temperature.fahrenheit}°F</span>
      </div>
      <div class="condition">${escapeHtml(w.condition)}</div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Humidity</span>
          <span class="stat-value">${w.humidity}%</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${w.humidity}%"></div>
          </div>
        </div>
        <div class="stat">
          <span class="stat-label">Wind</span>
          <span class="stat-value">${w.windKph} km/h</span>
        </div>
      </div>
    </div>`;
}

export function renderDashboard(): string {
  const weathers = CITIES.map(getWeather);
  const cards = weathers.map(card).join("\n");
  const now = new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #020b18;
      color: #dbeafe;
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    header h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #38bdf8, #2563eb, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    header p {
      margin-top: 0.4rem;
      font-size: 0.8rem;
      color: #3b6fa0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .card {
      background: #040f1f;
      border: 1px solid #0d2d4f;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(2, 80, 160, 0.25);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .city {
      font-size: 1.1rem;
      font-weight: 600;
      color: #bfdbfe;
    }

    .emoji {
      font-size: 2rem;
      line-height: 1;
    }

    .temp {
      font-size: 2.6rem;
      font-weight: 700;
      line-height: 1;
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }

    .temp-f {
      font-size: 1rem;
      font-weight: 400;
      color: #3b6fa0;
    }

    .condition {
      font-size: 0.85rem;
      color: #4d8cb5;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .stats {
      margin-top: 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      border-top: 1px solid #0d2d4f;
      padding-top: 0.75rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #3b6fa0;
      width: 4.5rem;
      flex-shrink: 0;
    }

    .stat-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: #bfdbfe;
      margin-right: auto;
    }

    .bar-track {
      width: 100%;
      height: 4px;
      background: #0d2d4f;
      border-radius: 2px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #2563eb);
      border-radius: 2px;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.75rem;
      color: #0d2d4f;
    }

    footer a {
      color: #3b6fa0;
      text-decoration: none;
    }

    footer a:hover { color: #38bdf8; }
  </style>
</head>
<body>
  <header>
    <h1>🌍 Weather Dashboard</h1>
    <p>Live mock data &mdash; updated on each request &mdash; ${now}</p>
  </header>

  <div class="grid">
    ${cards}
  </div>

  <footer>
    <p>
      <a href="/weather/London">/weather/:city</a> &nbsp;&bull;&nbsp;
      <a href="/forecast/London">/forecast/:city</a> &nbsp;&bull;&nbsp;
      <a href="/health">/health</a>
    </p>
  </footer>
</body>
</html>`;
}
