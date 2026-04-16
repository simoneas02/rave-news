import * as cookie from "cookie";
import { InternalServerError } from "errors/internalServerError";
import { MethodNotAllowedError } from "errors/methodNotAllowedError";
import { ValidationError } from "errors/validationError";
import { NotFoundError } from "errors/notFoundError";
import { UnauthorizedError } from "errors/unauthorizedError";
import { ForbiddenError } from "errors/forbiddenError";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError({});

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
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

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_token", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_token) {
    await injectAuthenticatedUser(request);

    return next();
  }

  await injectAnonymousUser(request);

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_token;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

async function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    if (authorization.can({ user: userTryingToRequest, feature })) {
      return next();
    }

    throw new ForbiddenError({
      message: `Access denied. Your account does not have the required permissions for the '${feature}' feature.`,
      action:
        "Please upgrade your subscription plan or contact your organization administrator to request access.",
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
