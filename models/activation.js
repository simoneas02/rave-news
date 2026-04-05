import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function runIsertQuery(userId, expiresAt) {
  const results = await database.query({
    text: `
      INSERT INTO
        user_activation_tokens(used_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
    values: [userId, expiresAt],
  });

  return results.rows[0];
}

async function runSelectById(userId) {
  const results = await database.query({
    text: `
      SELECT * FROM
        user_activation_tokens
      WHERE
        used_id = $1
      LIMIT
        1
      ;`,
    values: [userId],
  });

  return results.rows[0];
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

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

async function findOneByUserId(userId) {
  return await runSelectById(userId);
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
