import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";

const testEmail = `test-${Date.now()}@example.com`;
const secondEmail = `test-second-${Date.now()}@example.com`;
const testDate = "2025-01-15";

let token;
let secondToken;
let firstUserId;
let secondUserId;
let readingId;

describe("Sweety API Tests", () => {
  beforeAll(async () => {
    const firstUser = await request(app).post("/api/auth/register").send({ name: "Test User", email: testEmail, password: "TestPassword123" });
    expect(firstUser.statusCode).toBe(201);
    token = firstUser.body.token;
    firstUserId = firstUser.body.user.id;


    const secondUser = await request(app).post("/api/auth/register").send({ name: "Second User", email: secondEmail, password: "TestPassword123" });
    expect(secondUser.statusCode).toBe(201);
    secondToken = secondUser.body.token;
    secondUserId = secondUser.body.user.id;
  });

  afterAll(async () => {
    if (firstUserId) {
      await pool.query("DELETE FROM users WHERE id = $1", [firstUserId]);
    }

    if (secondUserId) {
      await pool.query("DELETE FROM users WHERE id = $1", [secondUserId]);
    }
    await pool.end();
  });

  test("should login with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: testEmail, password: "TestPassword123" });
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("should reject unauthenticated requests", async () => {
    const response = await request(app).get("/api/readings");
    expect(response.statusCode).toBe(401);
  });

  test("should create a glucose reading", async () => {
    const response = await request(app).post("/api/readings").set("Authorization", `Bearer ${token}`).send({ date: testDate, slot: "Morning (fasting)", value: 120 });
    expect(response.statusCode).toBe(201);

    const readings = await request(app).get("/api/readings").set("Authorization", `Bearer ${token}`);
    readingId = readings.body.readings[0].id;
    expect(readingId).toBeDefined();
  });

  test("should reject glucose values outside the allowed range", async () => {
    const response = await request(app).post("/api/readings").set("Authorization", `Bearer ${token}`).send({ date: testDate, slot: "After breakfast", value: 601 });
    expect(response.body.message).toBe("Value must be between 40 and 600 mg/dl.");
  });

  test("should reject duplicate readings for the same slot and date", async () => {
    const response = await request(app).post("/api/readings").set("Authorization", `Bearer ${token}`).send({ date: testDate, slot: "Morning (fasting)", value: 130 });
    expect(response.body.message).toBe("You already have an Morning (fasting) reading for this date.");
  });

  test("should not allow users to access another user's readings", async () => {
    const response = await request(app).get("/api/readings").set("Authorization", `Bearer ${secondToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.readings).toHaveLength(0);
  });

  test("should update an existing reading", async () => {
    const response = await request(app).put(`/api/readings/${readingId}`).set("Authorization", `Bearer ${token}`).send({ date: testDate, slot: "Morning (fasting)", value: 135 });
    expect(response.statusCode).toBe(200);
  });

  test("should calculate daily report statistics", async () => {
    const response = await request(app).get(`/api/reports/daily?date=${testDate}`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.summary.totalReadings).toBe(1);
    expect(Number(response.body.summary.average)).toBe(135);
  });

  test("should paginate readings through the main readings endpoint", async () => {
    const response = await request(app)
      .get("/api/readings?page=1&limit=20")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(response.body.readings).toHaveLength(1);
  });

  test("should return monthly trend data", async () => {
    const response = await request(app).get("/api/reports/trends").set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.trends).toHaveLength(6);
  });

  test("should delete an existing reading", async () => {
    const response = await request(app).delete(`/api/readings/${readingId}`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
  });
});
