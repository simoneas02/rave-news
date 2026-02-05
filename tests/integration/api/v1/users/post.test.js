import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";

export const USERS_URL = `${process.env.API_URL}/users`;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user01",
          email: "user01@gmail.com",
          password: "user01",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "user01",
        email: "user01@gmail.com",
        password: "user01",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated 'email'", async () => {
      const response1 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedEmail01",
          email: "duplicatedEmail@gmail.com",
          password: "duplicatedEmail01",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedEmail02",
          email: "DuplicatedEmail@gmail.com",
          password: "duplicatedEmail02",
        }),
      });

      expect(response2.status).toBe(400);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        name: "ValidationError",
        message:
          "The email 'DuplicatedEmail@gmail.com' already exists in the system.",
        action: "Please use another email address to register.",
        statusCode: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const response1 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedUsername",
          email: "duplicatedUsername01@gmail.com",
          password: "duplicatedUsername01",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "DuplicatedUsername",
          email: "duplicatedUsername02@gmail.com",
          password: "duplicatedUsername02",
        }),
      });

      expect(response2.status).toBe(400);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        name: "ValidationError",
        message:
          "The username 'DuplicatedUsername' already exists in the system.",
        action: "Please use another username to register.",
        statusCode: 400,
      });
    });
  });
});
