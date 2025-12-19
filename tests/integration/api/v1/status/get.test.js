import orchestrator from "tests/orchestrator";
export const STATUS_URL = `${process.env.API_URL}/status`;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("GET statusURL should return 200", async () => {
  const response = await fetch(STATUS_URL);
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.dependencies.version).toEqual("18.1");
  expect(responseBody.dependencies.max_connections).toEqual(100);
  expect(responseBody.dependencies.opened_connections).toEqual(1);
});
