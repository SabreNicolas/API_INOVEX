import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../entities";

const entities = [User];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>("NODE_ENV") || "dev";

        let dbConfig: {
          host: string;
          port?: number;
          username: string;
          password: string;
          database: string;
        };

        switch (nodeEnv) {
          case "prod":
            dbConfig = {
              host: configService.get<string>("DB_HOST_PROD") || "localhost",
              port: parseInt(
                configService.get<string>("DB_PORT_PROD") || "1433",
                10
              ),
              username: configService.get<string>("DB_USER_PROD") || "sa",
              password: configService.get<string>("DB_PASSWORD_PROD") || "",
              database:
                configService.get<string>("DB_NAME_PROD") || "cahier_soins",
            };
            break;
          case "preprod":
            dbConfig = {
              host: configService.get<string>("DB_HOST_PREPROD") || "localhost",
              port: parseInt(
                configService.get<string>("DB_PORT_PREPROD") || "1433",
                10
              ),
              username: configService.get<string>("DB_USER_PREPROD") || "sa",
              password: configService.get<string>("DB_PASSWORD_PREPROD") || "",
              database:
                configService.get<string>("DB_NAME_PREPROD") ||
                "cahier_soins_preprod",
            };
            break;
          default: {
            const dbPort = parseInt(
              configService.get<string>("DB_PORT") || "1433",
              10
            );
            dbConfig = {
              host: configService.get<string>("DB_HOST") || "localhost",
              port: dbPort,
              username: configService.get<string>("DB_USER") || "sa",
              password: configService.get<string>("DB_PASSWORD") || "",
              database:
                configService.get<string>("DB_NAME") || "cahier_soins_dev",
            };
          }
        }

        return {
          type: "mssql" as const,
          ...dbConfig,
          entities,
          synchronize: false, // Ne pas synchroniser en prod, utiliser les migrations
          logging: nodeEnv === "dev",
          options: {
            encrypt: false, // true si connexion Azure
            trustServerCertificate: true, // pour le développement local
          },
          extra: {
            connectionLimit: 10,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
