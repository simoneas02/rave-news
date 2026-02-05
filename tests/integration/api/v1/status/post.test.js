import orchestrator from "tests/orchestrator";
export const STATUS_URL = `${process.env.API_URL}/status`;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieven current system status", async () => {
      const response = await fetch(STATUS_URL, { method: "POST" });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "This method is not allowed for this endpoint.",
        action: "Verify that the HTTP method sent is valid for this endpoint.",
        status_code: 405,
      });
    });
  });
});
