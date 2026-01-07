import { Client } from "pg";
import { ServiceError } from "errors/serviceError";

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();

    const result = await client.query(queryObject);

    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Error connecting to the database or in the query.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

const getSSLValues = () =>
  process.env.NODE_ENV === "production" ? true : false;

async function getNewClient() {
  try {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      ssl: getSSLValues(),
    });

    await client.connect();

    return client;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Database connection error",
      cause: error,
    });
    throw serviceErrorObject;
  }
}

const database = {
  query,
  getNewClient,
};

export default database;
