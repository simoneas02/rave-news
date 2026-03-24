import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "models/migrator";
import { STATUS_URL } from "./integration/api/v1/status/get.test";
import user from "models/user";
import session from "models/session";

const EMAIL_HTTP_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServices();
  await waitForEmailServices();

  async function waitForWebServices() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch(STATUS_URL);
      const isResponseOk = response.status === 200;

      if (!isResponseOk) {
        throw Error();
      }
    }
  }

  async function waitForEmailServices() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(EMAIL_HTTP_URL);
      const isResponseOk = response.status === 200;

      if (!isResponseOk) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  const { username, email, password } = userObject;
  const fakerUsername = faker.internet.username().replace(/[_.-]/g, "");

  return await user.create({
    username: username || fakerUsername,
    email: email || faker.internet.email(),
    password: password || faker.internet.password(),
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${EMAIL_HTTP_URL}/messages`, { method: "DELETE" });
}

async function getLastEmail() {
  const emailListReponse = await fetch(`${EMAIL_HTTP_URL}/messages`);
  const emailListBody = await emailListReponse.json();

  const lastEmailItem = emailListBody.at(-1);

  const lastEmailResponse = await fetch(
    `${EMAIL_HTTP_URL}/messages/${lastEmailItem?.id}.plain`,
  );

  const emailTextBody = await lastEmailResponse.text();
  lastEmailItem.text = emailTextBody;

  return lastEmailItem;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
