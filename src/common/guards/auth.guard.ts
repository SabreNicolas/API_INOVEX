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
  role: UserRole;
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
    const requiredRole = this.reflector.getAllAndOverride<UserRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

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
      const userRole = this.getUserRole(decoded);

      // Vérification des permissions
      if (userRole < requiredRole) {
        throw new ForbiddenException(
          // eslint-disable-next-line security/detect-object-injection
          `${ERROR_MESSAGES.FORBIDDEN}. Rôle requis: ${ROLE_NAMES[requiredRole]}`
        );
      }

      // Enrichir la requête avec les informations utilisateur
      request.user = {
        ...decoded,
        role: userRole,
        roleName: ROLE_NAMES[userRole], // eslint-disable-line security/detect-object-injection
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

  private getUserRole(user: JwtPayload): UserRole {
    if (user.isSuperAdmin) return UserRole.IS_SUPER_ADMIN;
    if (user.isAdmin) return UserRole.IS_ADMIN;
    if (user.isChefQuart) return UserRole.IS_CHEF_QUART;
    if (user.isRapport) return UserRole.IS_RAPPORT;
    if (user.isQSE) return UserRole.IS_QSE;
    if (user.isSaisie) return UserRole.IS_SAISIE;
    if (user.isRondier) return UserRole.IS_RONDIER;
    return UserRole.IS_RONDIER;
  }
}
