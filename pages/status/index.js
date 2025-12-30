import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

function UpdatedAt({ isLoading, data }) {
  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    const { updated_at } = data;
    updatedAtText = new Date(updated_at).toLocaleString("pt-BR");
  }

  return <div>Last updated: {updatedAtText}</div>;
}

function DatabaseStatus({ isLoading, data }) {
  let databaseStatusInformation = "Carregando...";

  if (!isLoading && data) {
    const { version, max_connections, opened_connetions, database_name } =
      data.dependencies;

    databaseStatusInformation = (
      <>
        <div>Version: {version}</div>
        <div>Opened Connections: {opened_connetions}</div>
        <div>Max Connections: {max_connections}</div>
        <div>Database Name: {database_name}</div>
      </>
    );
  }

  return (
    <>
      <h2>Database</h2>
      <div>{databaseStatusInformation}</div>
    </>
  );
}

export default function StatusPage() {
  const response = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  const { isLoading, data } = response;

  return (
    <>
      <h1>Status Page</h1>
      <UpdatedAt isLoading={isLoading} data={data} />
      <DatabaseStatus isLoading={isLoading} data={data} />
    </>
  );
}
