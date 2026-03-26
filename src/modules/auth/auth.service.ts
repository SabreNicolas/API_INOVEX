import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";

import { AUTH_CONSTANTS } from "../../common/constants";
import { LoggerService } from "../../common/services/logger.service";
import { Token, User } from "../../entities";
import { Site } from "../../entities/site.entity";
import { LoginDto } from "./dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  async login(loginDto: LoginDto): Promise<
    | {
        accessToken: string;
        refreshToken: string;
        user: Omit<User, "pwd">;
      }
    | {
        requirePasswordChange: true;
        login: string;
        message: string;
      }
  > {
    const { login, password } = loginDto;

    try {
      const user = await this.userRepository.findOne({
        where: { login },
        select: [
          "id",
          "login",
          "nom",
          "prenom",
          "pwd",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
          "idUsine",
          "isKerlan",
          "isActif",
        ],
      });

      if (!user) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      if (!user.isActif) {
        throw new UnauthorizedException(
          "Votre compte est désactivé. Veuillez contacter l'administrateur."
        );
      }

      const isPasswordTemp = await argon2.verify(user.pwd, "temporaire");
      if (isPasswordTemp) {
        // Retourner un flag pour que le front affiche le formulaire de changement de mot de passe
        return {
          requirePasswordChange: true,
          login: user.login,
          message:
            "Votre mot de passe est temporaire. Veuillez le changer avant de vous connecter.",
        };
      }

      const isPasswordValid = await argon2.verify(user.pwd, password);

      if (!isPasswordValid) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      // Créer le payload JWT
      const payload = {
        id: user.id,
        login: user.login,
        nom: user.nom,
        prenom: user.prenom,
        isAdmin: Boolean(user.isAdmin),
        isRondier: Boolean(user.isRondier),
        isSaisie: Boolean(user.isSaisie),
        isQSE: Boolean(user.isQSE),
        isRapport: Boolean(user.isRapport),
        isChefQuart: Boolean(user.isChefQuart),
        isSuperAdmin: Boolean(user.isSuperAdmin),
        isKerlan: Boolean(user.isKerlan),
        idUsine: user.idUsine,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      });

      const refreshToken = this.jwtService.sign(
        { id: user.id, type: "refresh" },
        {
          secret: this.configService.get<string>("SECRET_KEY"),
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        }
      );

      this.logger.log(
        `Connexion réussie pour l'utilisateur: ${login}`,
        "AuthService"
      );

      // Stocker le hash du refresh token en DB
      const hashedRefreshToken = await argon2.hash(refreshToken);
      await this.tokenRepository.save(
        this.tokenRepository.create({
          token: hashedRefreshToken,
          affectation: `refresh:${user.id}`,
          enabled: true,
        })
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
    refreshToken: string,
    newIdUsine?: number
  ): Promise<{ accessToken: string; refreshToken: string; idUsine: number }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("SECRET_KEY"),
      });

      if (!decoded || !decoded.id || decoded.type !== "refresh") {
        throw new UnauthorizedException("Refresh token invalide");
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
        select: [
          "id",
          "login",
          "nom",
          "prenom",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
          "idUsine",
          "isKerlan",
        ],
      });

      if (!user) {
        throw new UnauthorizedException("Utilisateur non trouvé");
      }

      // Vérifier que le refresh token existe en DB et est actif
      const storedTokens = await this.tokenRepository.find({
        where: { affectation: `refresh:${user.id}`, enabled: true },
      });

      let matchedToken: Token | null = null;
      for (const stored of storedTokens) {
        const isMatch = await argon2.verify(stored.token, refreshToken);
        if (isMatch) {
          matchedToken = stored;
          break;
        }
      }

      if (!matchedToken) {
        throw new UnauthorizedException("Refresh token révoqué ou invalide");
      }

      // Déterminer l'idUsine à utiliser
      let idUsineToUse = user.idUsine;

      // Si un changement de site est demandé
      if (newIdUsine !== undefined && newIdUsine !== user.idUsine) {
        // Seuls les super admins peuvent changer de site
        if (!user.isSuperAdmin) {
          throw new ForbiddenException(
            "Seuls les super admins peuvent changer de site"
          );
        }

        // Vérifier que le site existe
        const site = await this.siteRepository.findOne({
          where: { id: newIdUsine },
          select: ["id"],
        });

        if (!site) {
          throw new UnauthorizedException(
            `Site avec l'ID ${newIdUsine} non trouvé`
          );
        }

        idUsineToUse = newIdUsine;
        this.logger.log(
          `Super admin ${user.login} change de site: ${user.idUsine} -> ${newIdUsine}`,
          "AuthService"
        );
      }

      // Générer de nouveaux tokens
      const payload = {
        id: user.id,
        login: user.login,
        nom: user.nom,
        prenom: user.prenom,
        isAdmin: Boolean(user.isAdmin),
        isRondier: Boolean(user.isRondier),
        isSaisie: Boolean(user.isSaisie),
        isQSE: Boolean(user.isQSE),
        isRapport: Boolean(user.isRapport),
        isChefQuart: Boolean(user.isChefQuart),
        isSuperAdmin: Boolean(user.isSuperAdmin),
        isKerlan: Boolean(user.isKerlan),
        idUsine: idUsineToUse,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      });

      const newRefreshToken = this.jwtService.sign(
        { id: user.id, type: "refresh" },
        {
          secret: this.configService.get<string>("SECRET_KEY"),
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        }
      );

      this.logger.log(
        `Tokens rafraîchis pour l'utilisateur: ${user.login}`,
        "AuthService"
      );

      // Rotation : désactiver l'ancien token et stocker le nouveau
      matchedToken.enabled = false;
      await this.tokenRepository.save(matchedToken);

      const hashedNewRefreshToken = await argon2.hash(newRefreshToken);
      await this.tokenRepository.save(
        this.tokenRepository.create({
          token: hashedNewRefreshToken,
          affectation: `refresh:${user.id}`,
          enabled: true,
        })
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        idUsine: idUsineToUse,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
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

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("SECRET_KEY"),
      });

      if (decoded?.id) {
        // Désactiver tous les refresh tokens de cet utilisateur
        await this.tokenRepository.update(
          { affectation: `refresh:${decoded.id}`, enabled: true },
          { enabled: false }
        );
      }
    } catch {
      // Token expiré ou invalide — on désactive rien, le logout est tout de même effectif côté cookies
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    const { login, currentPassword, newPassword } = changePasswordDto;

    try {
      const user = await this.userRepository.findOne({
        where: { login },
        select: ["id", "login", "pwd", "isActif"],
      });

      if (!user) {
        throw new UnauthorizedException("Utilisateur non trouvé");
      }

      if (!user.isActif) {
        throw new UnauthorizedException(
          "Votre compte est désactivé. Veuillez contacter l'administrateur."
        );
      }

      const isCurrentPasswordValid = await argon2.verify(
        user.pwd,
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException("Mot de passe actuel invalide");
      }

      // Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await argon2.verify(user.pwd, newPassword);
      if (isSamePassword) {
        throw new UnauthorizedException(
          "Le nouveau mot de passe doit être différent de l'ancien"
        );
      }

      const hashedNewPassword = await argon2.hash(newPassword);
      user.pwd = hashedNewPassword;
      await this.userRepository.save(user);

      // Révoquer tous les refresh tokens existants pour forcer une reconnexion
      await this.tokenRepository.update(
        { affectation: `refresh:${user.id}`, enabled: true },
        { enabled: false }
      );

      this.logger.log(
        `Mot de passe changé avec succès pour l'utilisateur: ${login}`,
        "AuthService"
      );

      return {
        success: true,
        message: "Mot de passe changé avec succès",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors du changement de mot de passe",
        error instanceof Error ? error.stack : String(error),
        "AuthService"
      );
      throw new UnauthorizedException(
        "Erreur lors du changement de mot de passe"
      );
    }
  }

  async cleanupDisabledTokens(): Promise<{ deletedCount: number }> {
    try {
      const result = await this.tokenRepository.delete({ enabled: false });
      const deletedCount = result.affected ?? 0;
      this.logger.log(
        `Nettoyage des tokens : ${deletedCount} tokens désactivés supprimés`,
        "AuthService"
      );
      return { deletedCount };
    } catch (error) {
      this.logger.error(
        "Erreur lors du nettoyage des tokens",
        error instanceof Error ? error.stack : String(error),
        "AuthService"
      );
      throw error;
    }
  }
}
