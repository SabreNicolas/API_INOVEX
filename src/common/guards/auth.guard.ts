import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

import { ERROR_MESSAGES, ROLE_NAMES, UserRole } from "../constants";
import { LoggerService } from "../services/logger.service";

export const ROLES_KEY = "roles";

export interface JwtPayload {
  id: number;
  login: string;
  nom: string;
  prenom: string;
  isRondier: boolean;
  isSaisie: boolean;
  isQSE: boolean;
  isRapport: boolean;
  isAdmin: boolean;
  isChefQuart: boolean;
  isSuperAdmin: boolean;
  idUsine: number;
  iat?: number;
  exp?: number;
}

export interface RequestUser extends JwtPayload {
  roles: UserRole[];
  roleName: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //Récupérer des rôles requis pour la route
    const requiredRole = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si aucun rôle requis, la route est publique
    if (requiredRole === undefined) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_MISSING);
    }

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>("SECRET_KEY"),
      });

      if (!decoded || !decoded.id) {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
      }

      // Détermination du rôle
      const userRole = this.getUserRoles(decoded);

      // Vérification des permissions
      if (!requiredRole.some(role => userRole.includes(role))) {
        const requiredRolesNames = requiredRole
          .map(r => ROLE_NAMES[r])
          .join(", ");
        const userRoleName = userRole.map(r => ROLE_NAMES[r]).join(", ");
        throw new ForbiddenException(
          `${ERROR_MESSAGES.FORBIDDEN}. Rôle requis: ${requiredRolesNames}, votre rôle: ${userRoleName}`
        );
      }

      // Enrichir la requête avec les informations utilisateur
      request.user = {
        ...decoded,
        roles: userRole,
        roleName: userRole.map(r => ROLE_NAMES[r]).join(", "), // eslint-disable-line security/detect-object-injection
      };

      return true;
    } catch (error) {
      this.logger.error(
        "Erreur d'authentification",
        error instanceof Error ? error.stack : String(error),
        "AuthGuard"
      );

      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "TokenExpiredError") {
          throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
        }
        if (error.name === "JsonWebTokenError") {
          throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
        }
      }

      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  private getUserRoles(user: JwtPayload): UserRole[] {
    const roles: UserRole[] = [];
    if (user.isSuperAdmin) roles.push(UserRole.IS_SUPER_ADMIN);
    if (user.isAdmin) roles.push(UserRole.IS_ADMIN);
    if (user.isChefQuart) roles.push(UserRole.IS_CHEF_QUART);
    if (user.isRapport) roles.push(UserRole.IS_RAPPORT);
    if (user.isSaisie) roles.push(UserRole.IS_SAISIE);
    if (user.isRondier) roles.push(UserRole.IS_RONDIER);
    return roles;
  }
}
