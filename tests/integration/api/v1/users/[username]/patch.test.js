import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import password from "models/password";

export const USERS_URL = `${process.env.API_URL}/users`;

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
      const user1Response = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user1",
          email: "user1@gmail.com",
          password: "user1",
        }),
      });

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user2",
          email: "user2@gmail.com",
          password: "user2",
        }),
      });

      expect(user2Response.status).toBe(201);

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
      const email1Response = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "email1",
          email: "email1@gmail.com",
          password: "email1",
        }),
      });

      expect(email1Response.status).toBe(201);

      const email2Response = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "email2",
          email: "email2@gmail.com",
          password: "email2",
        }),
      });

      expect(email2Response.status).toBe(201);

      const updatedEmail2 = await fetch(`${USERS_URL}/email2`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "email1@gmail.com",
        }),
      });

      expect(updatedEmail2.status).toBe(400);

      const responseBody = await updatedEmail2.json();

      expect(responseBody).toEqual({
        action: "Please use another email address to perform this operation.",
        message: "The email 'email1@gmail.com' already exists in the system.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      const uniqueUser1 = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "uniqueUser1",
          email: "uniqueUser1@gmail.com",
          password: "uniqueUser1",
        }),
      });

      expect(uniqueUser1.status).toBe(201);

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

      expect(responseBody).toEqual({
        id,
        username: "uniqueUser2",
        email: "uniqueUser1@gmail.com",
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
    const uniqueEmail1 = await fetch(USERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "uniqueEmail1",
        email: "uniqueEmail1@gmail.com",
        password: "uniqueEmail1",
      }),
    });

    expect(uniqueEmail1.status).toBe(201);

    const response = await fetch(`${USERS_URL}/uniqueEmail1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "uniqueEmail2@gmail.com" }),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    const { id, password, created_at, updated_at } = responseBody;

    expect(responseBody).toEqual({
      id,
      username: "uniqueEmail1",
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
    const uniquePassword1 = await fetch(USERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "uniquePassword1",
        email: "uniquePassword1@gmail.com",
        password: "uniquePassword1",
      }),
    });

    expect(uniquePassword1.status).toBe(201);

    const response = await fetch(`${USERS_URL}/uniquePassword1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "uniquePassword2" }),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    const { id, created_at, updated_at } = responseBody;

    expect(responseBody).toEqual({
      id,
      username: "uniquePassword1",
      email: "uniquePassword1@gmail.com",
      password: responseBody.password,
      created_at,
      updated_at,
    });

    expect(uuidVersion(id)).toBe(4);
    expect(Date.parse(created_at)).not.toBeNaN();
    expect(Date.parse(updated_at)).not.toBeNaN();
    expect(updated_at > created_at).toBe(true);

    const userInDatabase = await user.findeOneByUsername("uniquePassword1");
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
