import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { username } = request.query;
  const userFound = await user.findeOneByUsername(username);

  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const userImputValues = request.body;

  const updatedUser = await user.update(username, userImputValues);

  return response.status(200).json(updatedUser);
}
