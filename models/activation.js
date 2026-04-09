import database from "infra/database";
import email from "infra/email";
import user from "models/user";
import webserver from "infra/webserver";
import { NotFoundError } from "errors/notFoundError";
import authorization from "./authorization";
import { ForbiddenError } from "errors/forbiddenError";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function runIsertQuery(userId, expiresAt) {
  const results = await database.query({
    text: `
      INSERT INTO
        user_activation_tokens(user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
    values: [userId, expiresAt],
  });

  return results.rows[0];
}

async function runSelectByTokenId(tokenId) {
  const results = await database.query({
    text: `
      SELECT * FROM
        user_activation_tokens
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
    ;`,
    values: [tokenId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message:
        "The activation token provided is invalid, has already been used, or has expired.",
      action:
        "Please request a new activation link to proceed with your account verification.",
    });
  }

  return results.rows[0];
}

async function runUpdateQuery(tokenId) {
  const results = await database.query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [tokenId],
  });

  return results.rows[0];
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runIsertQuery(userId, expiresAt);

  return newToken;
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "rave-news <raves.contato@gmail.com>",
    to: user.email,
    subject: "Activate your registration to access rave-news",
    text: `${user.username}, click the link below to activate your registration on rave-news.
    
${webserver.origin}/register/activate/${activationToken.id}

Regards,
rave-news team :)
`,
  });
}

async function findOneValidById(tokenId) {
  const validToken = await runSelectByTokenId(tokenId);

  return validToken;
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (
    !authorization.can({
      user: userToActivate,
      feature: "read:activation_token",
    })
  ) {
    throw new ForbiddenError({
      message: "This activation link is invalid or has already been used.",
      action:
        "Please request a new activation email or contact support if the problem persists.",
    });
  }

  const activatedUser = await user.setFeatures({
    userId,
    features: ["create:session", "read:session", "update:user"],
  });

  return activatedUser;
}

async function markTokenAsUsed(tokenId) {
  const updatedToken = await runUpdateQuery(tokenId);

  return updatedToken;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
