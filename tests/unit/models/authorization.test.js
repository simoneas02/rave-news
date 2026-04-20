import authorization from "models/authorization";

describe("models/authorization", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can({});
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`user` with `features` is required in the `authorization` model.",
        }),
      );
    });

    test("without `user.features`", () => {
      const createdUser = { username: "UserWithoutFeatres" };

      expect(() => {
        authorization.can({ user: createdUser });
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`user` with `features` is required in the `authorization` model.",
        }),
      );
    });

    test("with unknown `feature`", () => {
      const createdUser = { features: [] };

      expect(() => {
        authorization.can({ user: createdUser, feature: "unknown:feature" });
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`feature` must be a valid and available feature in the `authorization` model.",
        }),
      );
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = { features: ["create:user"] };

      expect(
        authorization.can({ user: createdUser, feature: "create:user" }),
      ).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput({});
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`user` with `features` is required in the `authorization` model.",
        }),
      );
    });

    test("without `user.features`", () => {
      const createdUser = { username: "UserWithoutFeatres" };

      expect(() => {
        authorization.filterOutput({ user: createdUser });
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`user` with `features` is required in the `authorization` model.",
        }),
      );
    });

    test("with unknown `feature`", () => {
      const createdUser = { features: [] };

      expect(() => {
        authorization.filterOutput({
          user: createdUser,
          feature: "unknown:feature",
        });
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause:
            "`feature` must be a valid and available feature in the `authorization` model.",
        }),
      );
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = { features: ["read:user"] };

      expect(() => {
        authorization.filterOutput({
          user: createdUser,
          feature: "read:user",
        });
      }).toThrow(
        expect.objectContaining({
          name: "InternalServerError",
          cause: "`resource` is required in `authorization.filterOutput()`.",
        }),
      );
    });

    test("with valid `user`, known `feature` and `resource", () => {
      const createdUser = { features: ["read:user"] };

      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.000Z",
        updated_at: "2026-0101T00:00:00.000Z",
        email: "resource@resource.com",
        password: "resource",
      };

      const result = authorization.filterOutput({
        user: createdUser,
        feature: "read:user",
        resource,
      });

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.000Z",
        updated_at: "2026-0101T00:00:00.000Z",
      });
    });
  });
});
