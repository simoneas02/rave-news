import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import { USERS_URL } from "tests/consts";

import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/username", () => {
  describe("Anonymous user", () => {
    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser({});

      const response = await fetch(`${USERS_URL}/${createdUser.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "uniqueUser2",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Please upgrade your subscription plan or contact your organization administrator to request access.",
        message:
          "Access denied. Your account does not have the required permissions for the 'update:user' feature.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexitent 'username'", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionUserObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(`${USERS_URL}/username-not-registered`, {
        method: "PATCH",
        headers: { Cookie: `session_token=${sessionUserObject.token}` },
      });

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

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionUser2Object = await orchestrator.createSession(
        activatedUser2.id,
      );

      const updatedUser2 = await fetch(
        `${USERS_URL}/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionUser2Object.token}`,
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(updatedUser2.status).toBe(400);

      const responseBody = await updatedUser2.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The username 'user1' already exists in the system.",
        action: "Please use another username to perform this operation.",
        status_code: 400,
      });
    });

    test("With `user2` targeting `user1`", async () => {
      const createdUser1 = await orchestrator.createUser({});

      const createdUser2 = await orchestrator.createUser({});
      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionUser2Object = await orchestrator.createSession(
        activatedUser2.id,
      );

      const updatedUser1 = await fetch(
        `${USERS_URL}/${createdUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionUser2Object.token}`,
          },
          body: JSON.stringify({
            username: "user3",
          }),
        },
      );

      expect(updatedUser1.status).toBe(403);

      const responseBody = await updatedUser1.json();

      expect(responseBody).toEqual({
        action: "Check your account permissions or contact an administrator.",
        message: "You don't have permission to update this user.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@gmail.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@gmail.com",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionUser2Object = await orchestrator.createSession(
        activatedUser2.id,
      );

      const { username } = createdUser2;

      const updatedEmail2 = await fetch(`${USERS_URL}/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionUser2Object.token}`,
        },
        body: JSON.stringify({
          email: "email1@gmail.com",
        }),
      });

      expect(updatedEmail2.status).toBe(400);

      const responseBody = await updatedEmail2.json();

      expect(responseBody).toEqual({
        action: "Please use another email to perform this operation.",
        message: "The email 'email1@gmail.com' already exists in the system.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser({});

      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionUserObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(`${USERS_URL}/${createdUser.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionUserObject.token}`,
        },
        body: JSON.stringify({
          username: "uniqueUser2",
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { id, created_at, updated_at } = responseBody;

      expect(responseBody).toEqual({
        id,
        username: "uniqueUser2",
        features: ["create:session", "read:session", "update:user"],
        created_at,
        updated_at,
      });

      expect(uuidVersion(id)).toBe(4);
      expect(Date.parse(created_at)).not.toBeNaN();
      expect(Date.parse(updated_at)).not.toBeNaN();
      expect(updated_at > created_at).toBe(true);
    });

    test("With unique email", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@gmail.com",
      });

      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionUserObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const { username } = createdUser;

      const response = await fetch(`${USERS_URL}/${createdUser.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionUserObject.token}`,
        },
        body: JSON.stringify({ email: "uniqueEmail2@gmail.com" }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { id, password, created_at, updated_at } = responseBody;

      expect(responseBody).toEqual({
        id,
        username,
        features: ["create:session", "read:session", "update:user"],
        created_at,
        updated_at,
      });

      expect(uuidVersion(id)).toBe(4);
      expect(Date.parse(created_at)).not.toBeNaN();
      expect(Date.parse(updated_at)).not.toBeNaN();
      expect(updated_at > created_at).toBe(true);
    });

    test("With unique password", async () => {
      const createdUser = await orchestrator.createUser({
        password: "uniquePassword1",
      });

      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionUserObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const { username, email } = createdUser;

      const response = await fetch(`${USERS_URL}/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionUserObject.token}`,
        },
        body: JSON.stringify({ password: "uniquePassword2" }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { id, created_at, updated_at } = responseBody;

      expect(responseBody).toEqual({
        id,
        username,
        features: ["create:session", "read:session", "update:user"],
        created_at,
        updated_at,
      });

      expect(uuidVersion(id)).toBe(4);
      expect(Date.parse(created_at)).not.toBeNaN();
      expect(Date.parse(updated_at)).not.toBeNaN();
      expect(updated_at > created_at).toBe(true);

      const userInDatabase = await user.findeOneByUsername(username);
      const correctPasswordMatch = await password.compare(
        "uniquePassword2",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "uniquePassword1",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("PrivilegedUser", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedPrivilegedUser = await orchestrator.activateUser(
        privilegedUser.id,
      );
      await orchestrator.addFeaturesToUser({
        userId: privilegedUser.id,
        features: ["update:user:others"],
      });
      const sessionPrivilegedUserObject = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser({});

      const updatedDefaultUser = await fetch(
        `${USERS_URL}/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionPrivilegedUserObject.token}`,
          },
          body: JSON.stringify({
            username: "UpdatedByPrivilegedUser",
          }),
        },
      );

      expect(updatedDefaultUser.status).toBe(200);

      const responseBody = await updatedDefaultUser.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "UpdatedByPrivilegedUser",
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
