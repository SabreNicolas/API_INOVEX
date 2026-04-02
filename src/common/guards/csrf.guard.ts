import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { Request } from "express";

/**
 * CSRF Guard - Double Submit Cookie Pattern
 *
 * En production, vérifie que le header X-CSRF-Token correspond au cookie csrf-token.
 * Le token CSRF est généré lors du login et posé en cookie non-HttpOnly
 * (lisible par le JS client) et doit être renvoyé dans le header X-CSRF-Token
 * à chaque requête mutante (POST, PUT, PATCH, DELETE).
 *
 * Ce guard est utilisé globalement via APP_GUARD.
 * Les méthodes GET, HEAD, OPTIONS sont exemptées.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Exempter les méthodes safe (GET, HEAD, OPTIONS)
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Exempter en dev pour ne pas bloquer le développement
    const nodeEnv = this.configService.get<string>("NODE_ENV");
    if (nodeEnv !== "prod") {
      return true;
    }

    // Exempter le login (pas encore de token CSRF à ce stade)
    if (
      request.url.includes("/auth/login") ||
      request.url.includes("/auth/refresh")
    ) {
      return true;
    }

    // Exempter les routes de health check
    if (request.url.includes("/health")) {
      return true;
    }

    const csrfCookie = request.cookies?.["csrf-token"];
    const csrfHeader = request.headers["x-csrf-token"] as string;

    if (!csrfCookie || !csrfHeader) {
      throw new ForbiddenException("Token CSRF manquant");
    }

    // Comparaison constante pour éviter les timing attacks
    const isValid =
      csrfCookie.length === csrfHeader.length &&
      crypto.timingSafeEqual(Buffer.from(csrfCookie), Buffer.from(csrfHeader));

    if (!isValid) {
      throw new ForbiddenException("Token CSRF invalide");
    }

    return true;
  }

  /**
   * Génère un token CSRF aléatoire
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
