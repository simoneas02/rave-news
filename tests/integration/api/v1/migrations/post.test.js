import orchestrator from "tests/orchestrator";
import { MIGRATIONS_URL } from "tests/consts";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(MIGRATIONS_URL);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Please upgrade your subscription plan or contact your organization administrator to request access.",
        message:
          "Access denied. Your account does not have the required permissions for the 'read:migration' feature.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(MIGRATIONS_URL, {
        headers: { Cookie: `session_token=${sessionObject.token}` },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Please upgrade your subscription plan or contact your organization administrator to request access.",
        message:
          "Access denied. Your account does not have the required permissions for the 'read:migration' feature.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("With `read:migrations`", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const x = await orchestrator.addFeaturesToUser({
        userId: createdUser.id,
        features: ["create:migration"],
      });
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(MIGRATIONS_URL, {
        method: "POST",
        headers: { Cookie: `session_token=${sessionObject.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
