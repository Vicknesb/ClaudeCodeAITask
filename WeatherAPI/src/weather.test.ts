import { getWeather, getForecast } from "./weather";

test("getWeather is deterministic", () => {
  expect(getWeather("London")).toEqual(getWeather("London"));
});

test("getWeather returns exact seeded values for London", () => {
  const w = getWeather("London");
  expect(w.temperature.celsius).toBe(41);
  expect(w.temperature.fahrenheit).toBe(106);
  expect(w.condition).toBe("Foggy");
  expect(w.humidity).toBe(68);
  expect(w.windKph).toBe(20);
});

test("getWeather humidity is in range", () => {
  const w = getWeather("Tokyo");
  expect(w.humidity).toBeGreaterThanOrEqual(30);
  expect(w.humidity).toBeLessThanOrEqual(90);
});

test("getWeather fahrenheit conversion is correct", () => {
  const w = getWeather("Tokyo");
  expect(w.temperature.fahrenheit).toBe(Math.round(w.temperature.celsius * 9 / 5 + 32));
});

test("getWeather temperature celsius is in range", () => {
  const w = getWeather("Sydney");
  expect(w.temperature.celsius).toBeGreaterThanOrEqual(-5);
  expect(w.temperature.celsius).toBeLessThanOrEqual(45);
});

test("getWeather windKph is in range", () => {
  const w = getWeather("Paris");
  expect(w.windKph).toBeGreaterThanOrEqual(5);
  expect(w.windKph).toBeLessThanOrEqual(65);
});

test("getForecast returns 5 days in chronological order", () => {
  const { forecast } = getForecast("Paris");
  expect(forecast).toHaveLength(5);
  expect(new Date(forecast[1].date) > new Date(forecast[0].date)).toBe(true);
  expect(new Date(forecast[4].date) > new Date(forecast[3].date)).toBe(true);
});

test("getForecast city matches input", () => {
  expect(getForecast("Berlin").city).toBe("Berlin");
});

test("getForecast is deterministic", () => {
  expect(getForecast("London")).toEqual(getForecast("London"));
});
