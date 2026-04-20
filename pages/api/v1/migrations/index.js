import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const filteredOutputValues = authorization.filterOutput({
    user: userTryingToGet,
    feature: "read:migration",
    resource: pendingMigrations,
  });

  return response.status(200).json(filteredOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  const filteredOutputValues = authorization.filterOutput({
    user: userTryingToPost,
    feature: "read:migration",
    resource: migratedMigrations,
  });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(filteredOutputValues);
  }

  return response.status(200).json(filteredOutputValues);
}
