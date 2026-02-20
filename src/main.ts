import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { readFileSync } from "fs";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { LoggerService } from "./common/services/logger.service";

async function bootstrap() {
  // SSL : charger les certificats si disponibles
  const sslCertPath = process.env.SSL_CERT_PATH || "/app/certs/cert.cer";
  const sslKeyPath = process.env.SSL_KEY_PATH || "/app/certs/cert.key";

  let httpsOptions: { cert: Buffer; key: Buffer } | undefined;
  try {
    httpsOptions = {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      cert: readFileSync(sslCertPath),
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      key: readFileSync(sslKeyPath),
    };
    console.log(
      `🔒 Certificats SSL chargés depuis ${sslCertPath} et ${sslKeyPath}`
    );
  } catch (err) {
    console.warn(
      `⚠️ Certificats SSL non trouvés ou illisibles (${sslCertPath}, ${sslKeyPath}): ${(err as Error).message}`
    );
    console.warn("   → Démarrage en HTTP");
    httpsOptions = undefined;
  }

  const app = httpsOptions
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const nodeEnv = configService.get<string>("NODE_ENV");

  // Validation critique des variables de sécurité
  const secretKey = configService.get<string>("SECRET_KEY");
  if (!secretKey || secretKey.length < 32) {
    logger.error(
      "❌ SECRET_KEY manquante ou trop courte (minimum 32 caractères)",
      "Bootstrap"
    );
    process.exit(1);
  }

  // Global prefix
  app.setGlobalPrefix("api");

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === "prod" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // GZIP Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Limit request body size (protection DoS)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // CORS configuration
  const allowedOrigins = configService
    .get<string>("ALLOWED_ORIGINS")
    ?.split(",") || [
    "http://localhost:4200",
    "http://localhost:3000",
    "http://localhost:3102",
    "https://elevagedes4vents-soins.kerlan-info.fr",
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (healthchecks, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (nodeEnv === "dev") {
        callback(null, true);
      } else {
        callback(new Error("Origine non autorisée par CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "X-CSRF-Token",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)) // Pour class-transformer
  );

  // Swagger documentation (disabled in production)
  if (nodeEnv !== "prod") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("API Inovex")
      .setDescription("API pour l'outil de gestionINOVEX")
      .setVersion("2.0.0")
      .addCookieAuth("accessToken")
      .addTag("Authentification", "Endpoints de connexion/déconnexion")
      .addTag("Utilisateurs", "Gestion des utilisateurs")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api-docs", app, document);
  }

  // Start server
  const port = configService.get<number>("PORT") || 3100;
  await app.listen(port, "0.0.0.0");

  const protocol = httpsOptions ? "https" : "http";
  logger.log(
    `✅ API Inovex NestJS opérationnelle sur le port ${port} (${protocol.toUpperCase()})`,
    "Bootstrap"
  );
  if (nodeEnv !== "prod") {
    logger.log(
      `📚 Documentation Swagger: http://localhost:${port}/api-docs`,
      "Bootstrap"
    );
  }
}

bootstrap();
