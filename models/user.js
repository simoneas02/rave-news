import database from "infra/database";
import password from "models/password";
import { ValidationError } from "errors/validationError";
import { NotFoundError } from "errors/notFoundError";

async function runInsertQuery({ username, email, password }) {
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

async function validateUniqueAttribute({ attributeName, attributeValue }) {
  const results = await database.query({
    text: `
      SELECT 
        email
      FROM
        users
      WHERE
        LOWER(${attributeName}) = LOWER($1)
      `,
    values: [attributeValue],
  });

  const isDuplicatedAttribute = results.rowCount > 0;

  if (isDuplicatedAttribute) {
    throw new ValidationError({
      message: `The ${attributeName} '${attributeValue}' already exists in the system.`,
      action: `Please use another ${attributeName} to perform this operation.`,
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashPassword = await password.hash(userInputValues.password);

  userInputValues.password = hashPassword;
}

async function runSelectByAttribute({ attributeName, attributeValue }) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(${attributeName}) = LOWER($1)
      LIMIT
        1
      `,
    values: [attributeValue],
  });

  const isUsernameNotFound = results.rowCount === 0;

  if (isUsernameNotFound) {
    throw new NotFoundError({
      message: `The ${attributeName} '${attributeValue}' was not found in the system.`,
      action: `Please check if the ${attributeName} is correct.`,
    });
  }

  return results.rows[0];
}

async function runUpdateQuery({ id, username, email, password }) {
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

async function create(userInputValues) {
  const { username, email } = userInputValues;

  await validateUniqueAttribute({
    attributeName: "username",
    attributeValue: username,
  });

  await validateUniqueAttribute({
    attributeName: "email",
    attributeValue: email,
  });

  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;
}

async function update(username, userInputValues) {
  const currentUser = await findeOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueAttribute({
      attributeName: "username",
      attributeValue: userInputValues.username,
    });
  }

  if ("email" in userInputValues) {
    await validateUniqueAttribute({
      attributeName: "email",
      attributeValue: userInputValues.email,
    });
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };
  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;
}

async function findeOneByUsername(username) {
  const userFound = await runSelectByAttribute({
    attributeName: "username",
    attributeValue: username,
  });

  return userFound;
}

async function findOneByEmail(email) {
  const userFound = await runSelectByAttribute({
    attributeName: "email",
    attributeValue: email,
  });

  return userFound;
}

const user = {
  create,
  update,
  findeOneByUsername,
  findOneByEmail,
};
export default user;
