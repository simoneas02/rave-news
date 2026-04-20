import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "errors/forbiddenError";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const { username } = request.query;
  const userFound = await user.findeOneByUsername(username);

  const filteredOutputValues = authorization.filterOutput({
    user: userTryingToGet,
    feature: "read:user",
    resource: userFound,
  });

  return response.status(200).json(filteredOutputValues);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const userImputValues = request.body;
  const userTryingToPatch = request.context.user;
  const targetUser = await user.findeOneByUsername(username);

  const authorizationParams = {
    user: userTryingToPatch,
    feature: "update:user",
    resource: targetUser,
  };

  if (!authorization.can(authorizationParams)) {
    throw new ForbiddenError({
      message: "You don't have permission to update this user.",
      action: "Check your account permissions or contact an administrator.",
    });
  }

  const updatedUser = await user.update(username, userImputValues);

  const filteredOutputValues = authorization.filterOutput({
    user: userTryingToPatch,
    feature: "read:user",
    resource: updatedUser,
  });

  return response.status(200).json(filteredOutputValues);
}
