import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

import { RequestUser } from "../guards/auth.guard";

/**
 * Décorateur pour récupérer l'utilisateur courant depuis la requête
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user; // eslint-disable-line security/detect-object-injection
  }
);
