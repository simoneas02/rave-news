import { createRouter } from "next-connect";
import controller from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const sessionToken = request.cookies.session_token;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  const renewedSessionObject = await session.renew(sessionObject.id);

  controller.setSessionCookie({
    token: renewedSessionObject.token,
    response,
  });

  const userFound = await user.findOneById(sessionObject.user_id);
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const filteredOutputValues = authorization.filterOutput({
    user: userTryingToGet,
    feature: "read:user:self",
    resource: userFound,
  });

  return response.status(200).json(filteredOutputValues);
}
