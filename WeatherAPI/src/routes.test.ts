import request from "supertest";
import app from "./server";

test("GET /health returns ok status", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
  expect(res.body.uptime).toBeUndefined();  // uptime removed — info disclosure fix
});

test("GET /weather/:city rejects city with illegal characters", async () => {
  // %3Cscript%3E decodes to <script> — Express passes it to the route, validator rejects it
  const res = await request(app).get("/weather/%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
});

test("GET /forecast/:city rejects city over 100 chars", async () => {
  const longCity = "A".repeat(101);
  const res = await request(app).get(`/forecast/${longCity}`);
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
});

test("GET /weather/:city returns WeatherData", async () => {
  const res = await request(app).get("/weather/London");
  expect(res.status).toBe(200);
  expect(res.body.city).toBe("London");
  expect(res.body.temperature.celsius).toBe(41);
  expect(res.body.condition).toBe("Foggy");
});

test("GET /forecast/:city returns 5-day forecast", async () => {
  const res = await request(app).get("/forecast/Paris");
  expect(res.status).toBe(200);
  expect(res.body.city).toBe("Paris");
  expect(res.body.forecast).toHaveLength(5);
});

test("GET / returns HTML dashboard", async () => {
  const res = await request(app).get("/");
  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toMatch(/text\/html/);
  expect(res.text).toContain("London");
  expect(res.text).toContain("Tokyo");
});
