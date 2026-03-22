import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { email: userImputEmail, password: userImputPassword } = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser({
    userImputEmail,
    userImputPassword,
  });

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie({ token: newSession.token, response });

  return response.status(201).json(newSession);
}
