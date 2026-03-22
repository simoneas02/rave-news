import crypto from "node:crypto";
import database from "infra/database";

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
    `,
    values: [token, userId, expiresAt],
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

const session = {
  create,
  EXPIRATION_IN_MS,
};

export default session;
