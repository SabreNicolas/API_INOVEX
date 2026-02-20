import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AUTH_CONSTANTS } from "../../common/constants";
import { AuthGuard } from "../../common/guards/auth.guard";
import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("SECRET_KEY"),
        signOptions: { expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, LoggerService],
  exports: [JwtModule, AuthGuard, AuthService],
})
export class AuthModule {}
