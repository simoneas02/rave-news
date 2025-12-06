const LOCALHOST = "http://localhost:3000";
const STATUS_URL = "/api/v1/status";

test("GET statusURL should return 200", async () => {
  const response = await fetch(`${LOCALHOST}${STATUS_URL}`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.dependencies.version).toEqual("18.1");
  expect(responseBody.dependencies.max_connections).toEqual(100);
  expect(responseBody.dependencies.opened_connections).toEqual(1);
});
