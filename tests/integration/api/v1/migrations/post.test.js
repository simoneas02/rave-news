import database from "infra/database.js";

beforeAll(cleanDatabase);
async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

const LOCALHOST = "http://localhost:3000";
const MIGRATIONS_URL = "/api/v1/migrations";

test("POST statusURL should return 200", async () => {
  const response1 = await fetch(`${LOCALHOST}${MIGRATIONS_URL}`, {
    method: "POST",
  });
  expect(response1.status).toBe(200);

  const response1Body = await response1.json();

  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);

  const response2 = await fetch(`${LOCALHOST}${MIGRATIONS_URL}`, {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const response2Body = await response2.json();

  expect(Array.isArray(response2Body)).toBe(true);
  expect(response2Body.length).toBe(0);
});
