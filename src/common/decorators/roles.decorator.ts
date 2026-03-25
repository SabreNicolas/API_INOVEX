import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../constants";
import { ROLES_KEY } from "../guards/auth.guard";

/**
 * Décorateur pour spécifier le rôle minimum requis pour accéder à une route
 * @param role - Le rôle minimum requis
 */
export const RequireRole = (role: UserRole[]) => SetMetadata(ROLES_KEY, role);
