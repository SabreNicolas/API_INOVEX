import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";

import { AUTH_CONSTANTS } from "../../common/constants";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshDto,
  RefreshResponseDto,
} from "./dto";

@ApiTags("Authentification")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Helper pour poser les cookies access + refresh token
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const isProd = process.env.NODE_ENV === "prod";

    res.cookie(AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY_MS,
    });

    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
      path: "/api/auth", // Limiter le refresh token aux routes d'auth uniquement
    });
  }

  /**
   * Helper pour supprimer les cookies d'authentification
   */
  private clearAuthCookies(res: Response): void {
    const isProd = process.env.NODE_ENV === "prod";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
    };

    res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME, cookieOptions);
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, {
      ...cookieOptions,
      path: "/api/auth",
    });
  }

  @Post("login")
  @Throttle({
    default: {
      limit: AUTH_CONSTANTS.LOGIN_RATE_LIMIT,
      ttl: AUTH_CONSTANTS.LOGIN_RATE_LIMIT_TTL,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Connexion utilisateur" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Connexion réussie (cookies posés)",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "Identifiants invalides" })
  @ApiResponse({
    status: 429,
    description: "Trop de tentatives - Réessayez plus tard",
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    // Poser les cookies HttpOnly sécurisés
    this.setAuthCookies(res, accessToken, refreshToken);

    // Poser le cookie CSRF (non-HttpOnly pour être lisible par le JS client)
    const csrfToken = CsrfGuard.generateToken();
    res.cookie("csrf-token", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "prod",
      sameSite: process.env.NODE_ENV === "prod" ? "none" : "lax",
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
    });

    return {
      success: true,
      message: "Connexion réussie",
      data: {
        user: {
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
          idUsine: user.idUsine,
        },
        csrfToken,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post("refresh")
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rafraîchir les tokens d'authentification",
    description:
      "Rafraîchit les tokens. Les super admins peuvent optionnellement changer de site en passant idUsine dans le body.",
  })
  @ApiCookieAuth()
  @ApiBody({ type: RefreshDto, required: false })
  @ApiResponse({
    status: 200,
    description: "Tokens rafraîchis (nouveaux cookies posés)",
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: "Refresh token invalide ou expiré" })
  @ApiResponse({
    status: 403,
    description: "Changement de site non autorisé (réservé aux super admins)",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() refreshDto?: RefreshDto
  ) {
    const refreshToken =
      req.cookies?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token manquant");
    }

    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      idUsine,
    } = await this.authService.refreshTokens(refreshToken, refreshDto?.idUsine);

    // Poser les nouveaux cookies
    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    // Renouveler le token CSRF
    const csrfToken = CsrfGuard.generateToken();
    res.cookie("csrf-token", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "prod",
      sameSite: process.env.NODE_ENV === "prod" ? "none" : "lax",
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
    });

    return {
      success: true,
      message: "Tokens rafraîchis avec succès",
      data: { csrfToken, idUsine },
      timestamp: new Date().toISOString(),
    };
  }

  @Post("logout")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Déconnexion utilisateur" })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: "Déconnexion réussie",
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: "Non authentifié" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Révoquer le refresh token en DB
    const refreshToken =
      req.cookies?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearAuthCookies(res);

    return {
      success: true,
      message: "Déconnexion réussie",
      timestamp: new Date().toISOString(),
    };
  }
}
