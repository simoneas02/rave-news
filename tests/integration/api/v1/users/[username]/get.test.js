import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import { USERS_URL } from "tests/consts";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/username", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const createdUser = await orchestrator.createUser({
        username: "CaseMatch",
      });

      const response = await fetch(`${USERS_URL}/CaseMatch`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { email } = createdUser;

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "CaseMatch",
        email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const createdUser = await orchestrator.createUser({
        username: "CaseMismatch",
      });

      const response = await fetch(`${USERS_URL}/casemismatch`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { email } = createdUser;

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "CaseMismatch",
        email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With username not registered", async () => {
      const response = await fetch(`${USERS_URL}/username-not-registered`);

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "The username 'username-not-registered' was not found in the system.",
        action: "Please check if the username is correct.",
        status_code: 404,
      });
    });
  });
});
