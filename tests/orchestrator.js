import retry from "async-retry";
import { STATUS_URL } from "./integration/api/v1/status/get.test";

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

const orchestrator = {
  waitForAllServices,
};

export default orchestrator;
