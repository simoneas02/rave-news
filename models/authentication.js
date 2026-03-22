import { UnauthorizedError } from "errors/unauthorizedError";
import { NotFoundError } from "errors/notFoundError";
import password from "./password";
import user from "./user";

async function findUserByEmail(userImputEmail) {
  let storedUser;

  try {
    storedUser = await user.findOneByEmail(userImputEmail);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        message: "The authentication data does not match.",
        action: "Please check that the submitted data is correct.",
      });
    }

    throw error;
  }

  return storedUser;
}

async function validatePassword({ userImputPassword, storedPassword }) {
  const correctPasswordMatch = await password.compare(
    userImputPassword,
    storedPassword,
  );

  if (!correctPasswordMatch) {
    throw new UnauthorizedError({
      message: "Password does not match.",
      action: "Please check that the submitted data is correct.",
    });
  }
}

async function getAuthenticatedUser({ userImputEmail, userImputPassword }) {
  try {
    const storedUser = await findUserByEmail(userImputEmail);
    await validatePassword({
      userImputPassword,
      storedPassword: storedUser.password,
    });

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "The authentication data does not match.",
        action: "Please check that the submitted data is correct.",
      });
    }

    throw error;
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
