import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { CsrfGuard } from "./common/guards/csrf.guard";
import { HttpsRedirectMiddleware } from "./common/middlewares/https-redirect.middleware";
import { LoggerService } from "./common/services/logger.service";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AdminKerlanModule } from "./modules/admin-kerlan/admin-kerlan.module";
import { AnomalieModule } from "./modules/anomalie/anomalie.module";
import { ArretsModule } from "./modules/arrets/arrets.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BadgeModule } from "./modules/badge/badge.module";
import { ConsignesModule } from "./modules/consignes/consignes.module";
import { DepassementsModule } from "./modules/depassements/depassements.module";
import { ElementControleModule } from "./modules/element-controle/element-controle.module";
import { EnregistrementEquipeModule } from "./modules/enregistrement-equipe/enregistrement-equipe.module";
import { EquipeModule } from "./modules/equipe/equipe.module";
import { ExportModule } from "./modules/export/export.module";
import { FormulaireModule } from "./modules/formulaire/formulaire.module";
import { GroupementModule } from "./modules/groupement/groupement.module";
import { ImportTonnageMainModule } from "./modules/importTonnage/import-tonnage-main.module";
import { ModeOperatoireModule } from "./modules/mode-operatoire/mode-operatoire.module";
import { MoralEntitiesModule } from "./modules/moral-entities/moral-entities.module";
import { PostesRondierModule } from "./modules/postesRondier/postesRondier.module";
import { ProductsModule } from "./modules/products/products.module";
import { QuartActionsModule } from "./modules/quart-actions/quart-actions.module";
import { QuartActualiteModule } from "./modules/quart-actualite/quart-actualite.module";
import { QuartCalendrierModule } from "./modules/quart-calendrier/quart-calendrier.module";
import { QuartEvenementModule } from "./modules/quart-evenement/quart-evenement.module";
import { QuartLiensExternesModule } from "./modules/quart-liens-externes/quart-liens-externes.module";
import { RondierModule } from "./modules/rondier/rondier.module";
import { SiteModule } from "./modules/site/site.module";
import { UploadsModule } from "./modules/upload/uploads.module";
import { UsersModule } from "./modules/users/users.module";
import { ZoneControleModule } from "./modules/zone-controle/zone-controle.module";

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
        limit: 50,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 100,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 200,
      },
    ]),

    // Database
    DatabaseModule,

    // Health check (sans rate limiting)
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    SiteModule,
    PostesRondierModule,
    ImportTonnageMainModule,
    ProductsModule,
    BadgeModule,
    ConsignesModule,
    EnregistrementEquipeModule,
    EquipeModule,
    ZoneControleModule,
    GroupementModule,
    ElementControleModule,
    ModeOperatoireModule,
    RondierModule,
    FormulaireModule,
    ArretsModule,
    DepassementsModule,
    MoralEntitiesModule,
    QuartCalendrierModule,
    QuartActionsModule,
    QuartActualiteModule,
    QuartEvenementModule,
    QuartLiensExternesModule,
    AnomalieModule,
    UploadsModule,
    AdminKerlanModule,
    ExportModule,
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
