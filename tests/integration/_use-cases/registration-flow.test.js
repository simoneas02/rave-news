import orchestrator from "tests/orchestrator";
import { USERS_URL } from "tests/consts";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registratio Flow (all successful)", () => {
  test("Create user account", async () => {
    const response = await fetch(USERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@gmail.com",
        password: "RegistrationFlow",
      }),
    });

    expect(response.status).toBe(201);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      created_at: responseBody.created_at,
      email: "registration.flow@gmail.com",
      id: responseBody.id,
      password: responseBody.password,
      features: ["read:activation_token"],
      updated_at: responseBody.updated_at,
      username: "RegistrationFlow",
    });
  });

  // test("Receive activation email", async () => {});
  // test("Activation account", async () => {});
  // test("Login", async () => {});
  // test("Get user information", async () => {});
});
