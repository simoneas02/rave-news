import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator";
import { SESSIONS_URL } from "tests/consts";

import session from "models/session";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct password", async () => {
      await orchestrator.createUser({ password: "correct-password" });

      const response = await fetch(SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "incorrect.email@gmail.com",
          password: "correct-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Please check that the submitted data is correct.",
        message: "The authentication data does not match.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With correct email but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "correctEmail@gmail.com",
      });

      const response = await fetch(SESSIONS_URL, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          email: "correctEmail@gmail.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Please check that the submitted data is correct.",
        message: "The authentication data does not match.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser({});

      const response = await fetch(SESSIONS_URL, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          email: "incorrect.email@gmail.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Please check that the submitted data is correct.",
        message: "The authentication data does not match.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        username: "correct-user",
        email: "correct-email@gmail.com",
        password: "correctPassword",
      });

      await orchestrator.activateUser(createdUser.id);

      const response = await fetch(SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "correct-email@gmail.com",
          password: "correctPassword",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      const { created_at, expires_at, id, token, updated_at } = responseBody;

      expect(responseBody).toEqual({
        created_at,
        expires_at,
        id,
        token,
        updated_at,
        user_id: createdUser.id,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(expires_at);
      const createdAt = new Date(created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MS);

      const parsedSetCookie = setCookieParser(response, { map: true });

      expect(parsedSetCookie.session_token).toEqual({
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MS / 1000,
        name: "session_token",
        path: "/",
        value: responseBody.token,
      });
    });
  });
});
