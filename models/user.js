import database from "infra/database";
import password from "models/password";
import { ValidationError } from "errors/validationError";
import { NotFoundError } from "errors/notFoundError";

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
      action: "Please use another email address to perform this operation.",
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
      LIMIT
        1
      `,
    values: [username],
  });

  const isDuplicatedUsername = results.rowCount > 0;

  if (isDuplicatedUsername) {
    throw new ValidationError({
      message: `The username '${username}' already exists in the system.`,
      action: "Please use another username to perform this operation.",
    });
  }
}

async function hashPasswordInObject(userIputValues) {
  const hashPassword = await password.hash(userIputValues.password);

  userIputValues.password = hashPassword;
}

async function runSelectQuery(username) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      `,
    values: [username],
  });

  const isUsernameNotFound = results.rowCount === 0;

  if (isUsernameNotFound) {
    throw new NotFoundError({
      message: `The username '${username}' was not found in the system.`,
      action: "Please check if the username is correct.",
    });
  }

  return results.rows[0];
}

async function runUpdateQuery(userWithNewValues) {
  const { id, username, email, password } = userWithNewValues;

  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    `,
    values: [id, username, email, password],
  });

  return results.rows[0];
}

async function create(userIputValues) {
  const { username, email } = userIputValues;

  await validateUniqueUsername(username);
  await validateUniqueEmail(email);
  await hashPasswordInObject(userIputValues);

  const newUser = await runInsertQuery(userIputValues);
  return newUser;
}

async function update(username, userImputValues) {
  const currentUser = await findeOneByUsername(username);

  if ("username" in userImputValues) {
    await validateUniqueUsername(userImputValues.username);
  }

  if ("email" in userImputValues) {
    await validateUniqueEmail(userImputValues.email);
  }

  if ("password" in userImputValues) {
    await hashPasswordInObject(userImputValues);
  }

  const userWithNewValues = { ...currentUser, ...userImputValues };
  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;
}

async function findeOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;
}

const user = {
  create,
  findeOneByUsername,
  update,
};
export default user;
