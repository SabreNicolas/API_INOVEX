import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { CsrfGuard } from "./common/guards/csrf.guard";
import { HttpsRedirectMiddleware } from "./common/middlewares/https-redirect.middleware";
import { LoggerService } from "./common/services/logger.service";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || "dev"}`,
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 20,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    DatabaseModule,

    // Health check (sans rate limiting)
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
  ],
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [LoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware HTTPS obligatoire appliqué sur toutes les routes
    consumer.apply(HttpsRedirectMiddleware).forRoutes("*");
  }
}
