async function fetchStatus() {
  const response = await fetch("/api/v1/status");
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  console.log(">>>>>", fetchStatus());

  return <h1>Status Page</h1>;
}
