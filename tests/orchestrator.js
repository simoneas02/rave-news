import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "models/migrator";
import { STATUS_URL } from "./integration/api/v1/status/get.test";
import user from "models/user";

async function waitForAllServices() {
  await waitForWebServices();

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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
