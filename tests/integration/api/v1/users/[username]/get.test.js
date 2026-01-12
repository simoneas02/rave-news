import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";

export const USERS_URL = `${process.env.API_URL}/users`;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/username", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const response1 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "some-user",
          email: "some-user@gmail.com",
          password: "some-user",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${USERS_URL}/some-user`);

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "some-user",
        email: "some-user@gmail.com",
        password: "some-user",
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const response1 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "SomeUser",
          email: "SomeUser@gmail.com",
          password: "SomeUser",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${USERS_URL}/someuser`);

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "SomeUser",
        email: "SomeUser@gmail.com",
        password: "SomeUser",
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();
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
        statusCode: 404,
      });
    });
  });
});
