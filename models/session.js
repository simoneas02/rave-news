import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "errors/unauthorizedError";

const THIRTY_DAYS_IN_MS = {
  seconds: 60,
  minutes: 60,
  hours: 24,
  days: 30,
  msPerSecond: 1000,
};

const {
  seconds: SECONDS_PER_MINUTE,
  minutes: MINUTES_PER_HOUR,
  hours: HOURS_PER_DAY,
  days: TOTAL_DAYS,
  msPerSecond: MS_PER_SECOND,
} = THIRTY_DAYS_IN_MS;

const EXPIRATION_IN_MS =
  SECONDS_PER_MINUTE *
  MINUTES_PER_HOUR *
  HOURS_PER_DAY *
  TOTAL_DAYS *
  MS_PER_SECOND;

async function runInsertQuery({ token, userId, expiresAt }) {
  const results = await database.query({
    text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function runSelectByToken(sessionToken) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > NOW()
      LIMIT
        1
    ;`,
    values: [sessionToken],
  });

  const isSessionNotFound = results.rowCount === 0;

  if (isSessionNotFound) {
    throw new UnauthorizedError({
      message: "The user does not have an active session.",
      action: "Check if this user is logged in and try again.",
    });
  }

  return results.rows[0];
}

async function runUpdateQuery({ sessionId, expiresAt }) {
  const results = await database.query({
    text: `
      UPDATE
        sessions
      SET
        expires_at = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [sessionId, expiresAt],
  });

  return results.rows[0];
}

async function create(userId) {
  const sessionToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);

  const sessionData = await runInsertQuery({
    token: sessionToken,
    userId,
    expiresAt,
  });

  return sessionData;
}

async function findOneValidByToken(sessionToken) {
  return await runSelectByToken(sessionToken);
}

async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);
  const renewedSessionObject = await runUpdateQuery({ sessionId, expiresAt });

  return renewedSessionObject;
}

async function expireById(sessionId) {
  const expiresAt = new Date(Date.now() - EXPIRATION_IN_MS);
  const expiredSessionObject = await runUpdateQuery({ sessionId, expiresAt });

  return expiredSessionObject;
}

const session = {
  create,
  findOneValidByToken,
  EXPIRATION_IN_MS,
  renew,
  expireById,
};

export default session;
