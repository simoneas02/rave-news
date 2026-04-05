import orchestrator from "tests/orchestrator";
import { USERS_URL } from "tests/consts";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(USERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@gmail.com",
        password: "RegistrationFlow",
      }),
    });

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      created_at: createUserResponseBody.created_at,
      email: "registration.flow@gmail.com",
      id: createUserResponseBody.id,
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      updated_at: createUserResponseBody.updated_at,
      username: "RegistrationFlow",
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<raves.contato@gmail.com>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@gmail.com>");
    expect(lastEmail.subject).toBe(
      "Activate your registration to access rave-news",
    );
    expect(lastEmail.text).toContain("RegistrationFlow");

    const activationToken = await activation.findOneByUserId(
      createUserResponseBody?.id,
    );
    expect(lastEmail.text).toContain(activationToken.id);
  });

  // test("Activation account", async () => {});
  // test("Login", async () => {});
  // test("Get user information", async () => {});
});
