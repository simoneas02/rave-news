import database from "infra/database.js";

beforeAll(cleanDatabase);
async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

const LOCALHOST = "http://localhost:3000";
const MIGRATIONS_URL = "/api/v1/migrations";

test("GET statusURL should return 200", async () => {
  const response = await fetch(`${LOCALHOST}${MIGRATIONS_URL}`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});
