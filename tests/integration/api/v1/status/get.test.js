const LOCALHOST = "http://localhost:3000";
const STATUS_URL = "/api/v1/status";

test("GET statusURL should return 200", async () => {
  const response = await fetch(`${LOCALHOST}${STATUS_URL}`);

  expect(response.status).toBe(200);
});
