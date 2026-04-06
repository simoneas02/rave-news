import orchestrator from "tests/orchestrator";
import { USERS_URL, ACTIVATIONS_URL } from "tests/consts";
import activation from "models/activation";
import webserver from "infra/webserver";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;

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

    activationTokenId = await orchestrator.extractUUID(lastEmail.text);
    const activationTokenLink = `${webserver.origin}/register/activate/${activationTokenId}`;

    expect(lastEmail.text).toContain(activationTokenLink);

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activation account", async () => {
    const activationResponse = await fetch(
      `${ACTIVATIONS_URL}/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();
    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findeOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  // test("Login", async () => {});

  // test("Get user information", async () => {});
});
