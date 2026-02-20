import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
import { Request, Response } from "express";

import { LoggerService } from "../../common/services/logger.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    login: "testuser",
    nom: "Doe",
    prenom: "John",
    isAdmin: false,
    isVeto: false,
    isEditeur: true,
    isLecteur: true,
  };

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("test-secret"),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockResponse = () => {
    return {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as Response;
  };

  const createMockRequest = (cookies = {}) => {
    return {
      cookies,
    } as unknown as Request;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should login successfully and set cookies", async () => {
      const loginDto = { login: "testuser", password: "password123" };
      const mockTokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: mockUser,
      };
      mockAuthService.login.mockResolvedValue(mockTokens);

      const mockRes = createMockResponse();

      const result = await controller.login(loginDto, mockRes);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Connexion réussie");
      expect(result.data.user.id).toBe(1);
      expect(result.data.user.login).toBe("testuser");
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const mockNewTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };
      mockAuthService.refreshTokens.mockResolvedValue(mockNewTokens);

      const mockReq = createMockRequest({ refreshToken: "old-refresh-token" });
      const mockRes = createMockResponse();

      const result = await controller.refresh(mockReq, mockRes);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Tokens rafraîchis avec succès");
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when refresh token is missing", async () => {
      const mockReq = createMockRequest({});
      const mockRes = createMockResponse();

      await expect(controller.refresh(mockReq, mockRes)).rejects.toThrow(
        "Refresh token manquant"
      );
    });
  });

  describe("logout", () => {
    it("should logout and clear cookies", () => {
      const mockRes = createMockResponse();

      const result = controller.logout(mockRes);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Déconnexion réussie");
      expect(mockRes.clearCookie).toHaveBeenCalled();
    });
  });
});
