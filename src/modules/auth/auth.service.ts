import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";

import { AUTH_CONSTANTS } from "../../common/constants";
import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { LoginDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, "pwd">;
  }> {
    const { login, password } = loginDto;

    try {
      const user = await this.userRepository.findOne({
        where: { login },
        select: [
          "Id",
          "login",
          "Nom",
          "Prenom",
          "pwd",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
        ],
      });

      if (!user) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      const isPasswordValid = await argon2.verify(user.pwd, password);

      if (!isPasswordValid) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      // Créer le payload JWT
      const payload = {
        id: user.Id,
        login: user.login,
        nom: user.Nom,
        prenom: user.Prenom,
        isAdmin: Boolean(user.isAdmin),
        isRondier: Boolean(user.isRondier),
        isSaisie: Boolean(user.isSaisie),
        isQSE: Boolean(user.isQSE),
        isRapport: Boolean(user.isRapport),
        isChefQuart: Boolean(user.isChefQuart),
        isSuperAdmin: Boolean(user.isSuperAdmin),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      });

      const refreshToken = this.jwtService.sign(
        { id: user.Id, type: "refresh" },
        {
          secret: this.configService.get<string>("SECRET_KEY"),
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        }
      );

      this.logger.log(
        `Connexion réussie pour l'utilisateur: ${login}`,
        "AuthService"
      );

      // Retourner les tokens et les infos utilisateur (sans le mot de passe)
      const { pwd: _, ...userWithoutPassword } = user;
      return { accessToken, refreshToken, user: userWithoutPassword };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la connexion",
        error instanceof Error ? error.stack : String(error),
        "AuthService"
      );
      throw new UnauthorizedException("Erreur lors de la connexion");
    }
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("SECRET_KEY"),
      });

      if (!decoded || !decoded.id || decoded.type !== "refresh") {
        throw new UnauthorizedException("Refresh token invalide");
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await this.userRepository.findOne({
        where: { Id: decoded.id },
        select: [
          "Id",
          "login",
          "Nom",
          "Prenom",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
        ],
      });

      if (!user) {
        throw new UnauthorizedException("Utilisateur non trouvé");
      }

      // Générer de nouveaux tokens
      const payload = {
        id: user.Id,
        login: user.login,
        nom: user.Nom,
        prenom: user.Prenom,
        isAdmin: Boolean(user.isAdmin),
        isRondier: Boolean(user.isRondier),
        isSaisie: Boolean(user.isSaisie),
        isQSE: Boolean(user.isQSE),
        isRapport: Boolean(user.isRapport),
        isChefQuart: Boolean(user.isChefQuart),
        isSuperAdmin: Boolean(user.isSuperAdmin),
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      });

      const newRefreshToken = this.jwtService.sign(
        { id: user.Id, type: "refresh" },
        {
          secret: this.configService.get<string>("SECRET_KEY"),
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        }
      );

      this.logger.log(
        `Tokens rafraîchis pour l'utilisateur: ${user.login}`,
        "AuthService"
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors du refresh token",
        error instanceof Error ? error.stack : String(error),
        "AuthService"
      );
      throw new UnauthorizedException("Refresh token invalide ou expiré");
    }
  }
}
