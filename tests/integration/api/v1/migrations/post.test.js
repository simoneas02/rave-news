import database from "infra/database.js";
import orchestrator from "tests/orchestrator";
import { MIGRATIONS_URL } from "./get.test";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
});

test("POST statusURL should return 200", async () => {
  const response1 = await fetch(MIGRATIONS_URL, {
    method: "POST",
  });
  expect(response1.status).toBe(201);

  const response1Body = await response1.json();

  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);

  const response2 = await fetch(MIGRATIONS_URL, {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const response2Body = await response2.json();

  expect(Array.isArray(response2Body)).toBe(true);
  expect(response2Body.length).toBe(0);
});
