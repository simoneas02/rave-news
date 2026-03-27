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
    test("With nonexitent 'username'", async () => {
      const response = await fetch(`${USERS_URL}/username-not-registered`, {
        method: "PATCH",
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

      await orchestrator.createUser({
        username: "user2",
      });

      const updatedUser2 = await fetch(`${USERS_URL}/user2`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(updatedUser2.status).toBe(400);

      const responseBody = await updatedUser2.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The username 'user1' already exists in the system.",
        action: "Please use another username to perform this operation.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@gmail.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@gmail.com",
      });

      const { username } = createdUser2;

      const updatedEmail2 = await fetch(`${USERS_URL}/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      const createdUser = await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const response = await fetch(`${USERS_URL}/uniqueUser1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "uniqueUser2",
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const { id, password, created_at, updated_at } = responseBody;
      const { email } = createdUser;

      expect(responseBody).toEqual({
        id,
        username: "uniqueUser2",
        email,
        password,
        created_at,
        updated_at,
      });

      expect(uuidVersion(id)).toBe(4);
      expect(Date.parse(created_at)).not.toBeNaN();
      expect(Date.parse(updated_at)).not.toBeNaN();
      expect(updated_at > created_at).toBe(true);
    });
  });

  test("With unique email", async () => {
    const createdUser = await orchestrator.createUser({
      email: "uniqueEmail1@gmail.com",
    });

    const { username } = createdUser;

    const response = await fetch(`${USERS_URL}/${username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "uniqueEmail2@gmail.com" }),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    const { id, password, created_at, updated_at } = responseBody;

    expect(responseBody).toEqual({
      id,
      username,
      email: "uniqueEmail2@gmail.com",
      password,
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

    const { username, email } = createdUser;

    const response = await fetch(`${USERS_URL}/${username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "uniquePassword2" }),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    const { id, created_at, updated_at } = responseBody;

    expect(responseBody).toEqual({
      id,
      username,
      email,
      password: responseBody.password,
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
