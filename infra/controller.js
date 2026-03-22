import * as cookie from "cookie";
import { InternalServerError } from "errors/internalServerError";
import { MethodNotAllowedError } from "errors/methodNotAllowedError";
import { ValidationError } from "errors/validationError";
import { NotFoundError } from "errors/notFoundError";
import { UnauthorizedError } from "errors/unauthorizedError";
import session from "models/session";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie({ token, response }) {
  const setCookie = cookie.serialize("session_token", token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
};

export default controller;
