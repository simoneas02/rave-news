import { version as uuidVersion } from "uuid";
import activation from "models/activation";
import user from "models/user";
import { ACTIVATIONS_URL } from "tests/consts";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const nonexistentToken = "31e512ae-ae79-4082-96fe-6e55dfa912b5";
      const response = await fetch(`${ACTIVATIONS_URL}/${nonexistentToken}`, {
        method: "PATCH",
      });

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "The activation token provided is invalid, has already been used, or has expired.",
        action:
          "Please request a new activation link to proceed with your account verification.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const activationResponse = await fetch(
        `${ACTIVATIONS_URL}/${expiredActivationToken.id}`,
        { method: "PATCH" },
      );

      expect(activationResponse.status).toBe(404);

      const activationResponseBody = await activationResponse.json();

      expect(activationResponseBody).toEqual({
        action:
          "Please request a new activation link to proceed with your account verification.",
        message:
          "The activation token provided is invalid, has already been used, or has expired.",
        name: "NotFoundError",
        status_code: 404,
      });
    });

    test("With alread used token", async () => {
      const createdUser = await orchestrator.createUser({});
      const activationToken = await activation.create(createdUser.id);

      const activationResponse1 = await fetch(
        `${ACTIVATIONS_URL}/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(activationResponse1.status).toBe(200);

      const activationResponse2 = await fetch(
        `${ACTIVATIONS_URL}/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(activationResponse2.status).toBe(404);

      const activationResponse2Body = await activationResponse2.json();

      expect(activationResponse2Body).toEqual({
        action:
          "Please request a new activation link to proceed with your account verification.",
        message:
          "The activation token provided is invalid, has already been used, or has expired.",
        name: "NotFoundError",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({});
      const activationToken = await activation.create(createdUser.id);

      const activationResponse = await fetch(
        `${ACTIVATIONS_URL}/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(activationResponse.status).toBe(200);

      const activationResponseBody = await activationResponse.json();

      expect(activationResponseBody).toEqual({
        created_at: activationToken.created_at.toISOString(),
        expires_at: activationToken.expires_at.toISOString(),
        id: activationToken.id,
        updated_at: activationResponseBody.updated_at,
        used_at: activationResponseBody.used_at,
        user_id: activationToken.user_id,
      });

      expect(uuidVersion(activationResponseBody.id)).toBe(4);
      expect(uuidVersion(activationToken.id)).toBe(4);

      expect(Date.parse(activationResponseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.updated_at)).not.toBeNaN();
      expect(
        activationResponseBody.updated_at > activationResponseBody.created_at,
      ).toBe(true);

      const expiresAt = new Date(activationResponseBody.expires_at);
      const createdAt = new Date(activationResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(
        activationResponseBody.user_id,
      );

      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser({});
      await orchestrator.activateUser(createdUser.id);
      const activationToken = await activation.create(createdUser.id);

      const activatedResponse = await fetch(
        `${ACTIVATIONS_URL}/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(activatedResponse.status).toBe(403);

      const activatedResponseBody = await activatedResponse.json();

      expect(activatedResponseBody).toEqual({
        action:
          "Please request a new activation email or contact support if the problem persists.",
        message: "This activation link is invalid or has already been used.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With a valid token, but already logged in user", async () => {
      const user1 = await orchestrator.createUser({});
      await orchestrator.activateUser(user1.id);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser({});
      const user2ActivationToken = await activation.create(user2.id);

      const activatedResponse = await fetch(
        `${ACTIVATIONS_URL}/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: { Cookie: `session_token=${user1SessionObject.token}` },
        },
      );

      expect(activatedResponse.status).toBe(403);

      const activatedResponseBody = await activatedResponse.json();

      expect(activatedResponseBody).toEqual({
        action:
          "Please upgrade your subscription plan or contact your organization administrator to request access.",
        message:
          "Access denied. Your account does not have the required permissions for the 'read:activation_token' feature.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
