import orchestrator from "tests/orchestrator";
import { STATUS_URL } from "tests/consts";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieven current system status", async () => {
      const response = await fetch(STATUS_URL);
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.version).toEqual("18.1");
      expect(responseBody.dependencies.max_connections).toEqual(100);
      expect(responseBody.dependencies.opened_connections).toEqual(1);
    });
  });
});
