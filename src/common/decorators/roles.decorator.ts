import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../constants";
import { ROLES_KEY } from "../guards/auth.guard";

/**
 * Décorateur pour spécifier le rôle minimum requis pour accéder à une route
 * @param role - Le rôle minimum requis
 */
export const RequireRole = (role: UserRole) => SetMetadata(ROLES_KEY, role);

/**
 * Décorateur pour les routes accessibles uniquement aux lecteurs et plus
 */
export const RequireRondier = () => RequireRole(UserRole.IS_RONDIER);

/**
 * Décorateur pour les routes accessibles uniquement aux éditeurs et plus
 */
export const RequireSaisie = () => RequireRole(UserRole.IS_SAISIE);

/**
 * Décorateur pour les routes accessibles uniquement aux QSE et plus
 */
export const RequireQSE = () => RequireRole(UserRole.IS_QSE);

/**
 * Décorateur pour les routes accessibles uniquement aux rapporteurs et plus
 */
export const RequireRapport = () => RequireRole(UserRole.IS_RAPPORT);

/**
 * Décorateur pour les routes accessibles uniquement aux administrateurs et plus
 */
export const RequireAdmin = () => RequireRole(UserRole.IS_ADMIN);

/**
 * Décorateur pour les routes accessibles uniquement aux chefs de quart et plus
 */
export const RequireChefQuart = () => RequireRole(UserRole.IS_CHEF_QUART);

/**
 * Décorateur pour les routes accessibles uniquement aux super administrateurs
 */
export const RequireSuperAdmin = () => RequireRole(UserRole.IS_SUPER_ADMIN);
