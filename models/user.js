import database from "infra/database";
import { ValidationError } from "errors/validationError";

async function runInsertQuery(userIputValues) {
  const { username, email, password } = userIputValues;

  const results = await database.query({
    text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
      `,
    values: [username, email, password],
  });

  return results.rows[0];
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT 
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      `,
    values: [email],
  });

  const isDuplicatedEmail = results.rowCount > 0;

  if (isDuplicatedEmail) {
    throw new ValidationError({
      message: `The email '${email}' already exists in the system.`,
      action: "Please use another email address to register.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT 
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      `,
    values: [username],
  });

  const isDuplicatedUsername = results.rowCount > 0;

  if (isDuplicatedUsername) {
    throw new ValidationError({
      message: `The username '${username}' already exists in the system.`,
      action: "Please use another username to register.",
    });
  }
}

async function create(userIputValues) {
  const { username, email } = userIputValues;

  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await runInsertQuery(userIputValues);
  return newUser;
}

const user = {
  create,
};
export default user;
