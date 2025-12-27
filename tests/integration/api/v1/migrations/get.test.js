import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

export const MIGRATIONS_URL = `${process.env.API_URL}/migrations`;

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(MIGRATIONS_URL);
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
