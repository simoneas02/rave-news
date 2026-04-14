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

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedPrivilegedUser = await orchestrator.activateUser(
        privilegedUser.id,
      );
      await orchestrator.addFeaturesToUser({
        userId: privilegedUser.id,
        features: ["read:status:all"],
      });
      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const response = await fetch(STATUS_URL, {
        headers: {
          Cookie: `session_token=${privilegedUserSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database.version).toEqual("18.1");
    });
  });
});
