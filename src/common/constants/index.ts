/**
 * Constantes de l'application
 * Centralise toutes les constantes utilisées dans l'application
 */

// Rôles utilisateur
export enum UserRole {
  IS_RONDIER = 1,
  IS_SAISIE = 2,
  IS_RAPPORT = 3,
  IS_CHEF_QUART = 4,
  IS_ADMIN = 5,
  IS_SUPER_ADMIN = 6,
  IS_KERLAN = 7,
}

// Mapping des noms de rôles
export const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.IS_RONDIER]: "Rondier",
  [UserRole.IS_SAISIE]: "Saisie",
  [UserRole.IS_RAPPORT]: "Rapport",
  [UserRole.IS_ADMIN]: "Administrateur",
  [UserRole.IS_CHEF_QUART]: "Chef de quart",
  [UserRole.IS_SUPER_ADMIN]: "Super Administrateur",
  [UserRole.IS_KERLAN]: "Kerlan",
};

// Constantes d'authentification
export const AUTH_CONSTANTS = {
  // Access token (courte durée)
  ACCESS_TOKEN_EXPIRY: "15m",
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes en millisecondes
  ACCESS_TOKEN_COOKIE_NAME: "accessToken",

  // Refresh token (longue durée)
  REFRESH_TOKEN_EXPIRY: "7d",
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
  REFRESH_TOKEN_COOKIE_NAME: "refreshToken",

  // Legacy
  TOKEN_EXPIRY_HOURS: 24,
  TOKEN_EXPIRY_MS: 15 * 60 * 1000,
  COOKIE_NAME: "accessToken",

  LOGIN_RATE_LIMIT: 5, // Tentatives par minute
  LOGIN_RATE_LIMIT_TTL: 60000, // 1 minute en millisecondes
} as const;

// Pagination par défaut
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  // Authentification
  TOKEN_MISSING: "Token d'authentification manquant",
  TOKEN_INVALID: "Token invalide",
  TOKEN_EXPIRED: "Token expiré",
  UNAUTHORIZED: "Accès non autorisé",
  FORBIDDEN: "Permissions insuffisantes",

  // Validation
  VALIDATION_ERROR: "Erreur de validation",
  REQUIRED_FIELD: "Ce champ est requis",
  INVALID_FORMAT: "Format invalide",

  // Base de données
  NOT_FOUND: "Ressource non trouvée",
  DUPLICATE_ENTRY: "Cette valeur existe déjà",
  DATABASE_ERROR: "Erreur de base de données",

  // Général
  INTERNAL_ERROR: "Erreur interne du serveur",
  OPERATION_FAILED: "Opération échouée",
};

// Messages de succès standardisés
export const SUCCESS_MESSAGES = {
  CREATED: "Ressource créée avec succès",
  UPDATED: "Ressource mise à jour avec succès",
  DELETED: "Ressource supprimée avec succès",
  ACTIVATED: "Ressource activée avec succès",
  DEACTIVATED: "Ressource désactivée avec succès",
  OPERATION_SUCCESS: "Opération réussie",
};
