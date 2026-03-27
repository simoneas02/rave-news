import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator";
import { SESSIONS_URL } from "tests/consts";
import { USER_URL } from "tests/consts";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With a nonexistent session", async () => {
      const nonexitentToken =
        "782fac1b8cecbe8d8fd036eb4d15875646c2c15a7be0bed01f52847424d70f6b6a40a90fbf5168e385900510ac24f538";

      const response = await fetch(SESSIONS_URL, {
        method: "DELETE",
        headers: { Cookie: `session_token=${nonexitentToken}` },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Check if this user is logged in and try again.",
        message: "The user does not have an active session.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MS),
      });

      const createdUser = await orchestrator.createUser({
        username: "ExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(SESSIONS_URL, {
        method: "DELETE",
        headers: { Cookie: `session_token=${sessionObject.token}` },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Check if this user is logged in and try again.",
        message: "The user does not have an active session.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With a valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(SESSIONS_URL, {
        method: "DELETE",
        headers: { Cookie: `session_token=${sessionObject.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        user_id: sessionObject.user_id,
        id: sessionObject.id,
        token: sessionObject.token,
        updated_at: responseBody.updated_at,
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(
        responseBody.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, { map: true });

      expect(parsedSetCookie.session_token).toEqual({
        httpOnly: true,
        maxAge: -1,
        name: "session_token",
        path: "/",
        value: "invalid",
      });

      // Double check assertion
      const doubleCheckResponse = await fetch(USER_URL, {
        headers: { Cookie: `session_token=${sessionObject.token}` },
      });

      expect(doubleCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doubleCheckResponse.json();
      expect(doubleCheckResponseBody).toEqual({
        action: "Check if this user is logged in and try again.",
        message: "The user does not have an active session.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });
  });
});
