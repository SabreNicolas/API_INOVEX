import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware pour rediriger HTTP vers HTTPS en production
 * et bloquer les requêtes non-sécurisées
 */
@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const nodeEnv = this.configService.get<string>("NODE_ENV");

    // En production, on vérifie que la requête est en HTTPS
    if (nodeEnv === "prod") {
      // Exclure les requêtes internes (healthchecks Docker, curl localhost)
      const host = req.hostname || req.headers.host || "";
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.")
      ) {
        return next();
      }

      // Vérification via le header X-Forwarded-Proto (utilisé par les proxies/load balancers)
      const forwardedProto = req.headers["x-forwarded-proto"];
      const isSecure = req.secure || forwardedProto === "https";

      if (!isSecure) {
        const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
        return res.redirect(301, httpsUrl);
      }
    }

    next();
  }
}
