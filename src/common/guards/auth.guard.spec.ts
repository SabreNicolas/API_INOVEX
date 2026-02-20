import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { UserRole } from "../constants";
import { LoggerService } from "../services/logger.service";
import { AuthGuard, JwtPayload, ROLES_KEY } from "./auth.guard";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("test-secret"),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockExecutionContext = (
    cookies: Record<string, string> = {}
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          cookies,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
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
          useValue: mockReflector,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should allow access when no role is required (public route)", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw UnauthorizedException when token is missing", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.LECTEUR);
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should allow access for valid token with sufficient role", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.LECTEUR);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "testuser",
        nom: "Doe",
        prenom: "John",
        isAdmin: false,
        isVeto: false,
        isEditeur: false,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "valid-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verify).toHaveBeenCalledWith("valid-token", {
        secret: "test-secret",
      });
    });

    it("should throw ForbiddenException when role is insufficient", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.ADMIN);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "testuser",
        nom: "Doe",
        prenom: "John",
        isAdmin: false,
        isVeto: false,
        isEditeur: false,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "valid-token",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("should throw UnauthorizedException for expired token", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.LECTEUR);
      const tokenExpiredError = new Error("Token expired");
      tokenExpiredError.name = "TokenExpiredError";
      mockJwtService.verify.mockImplementation(() => {
        throw tokenExpiredError;
      });

      const context = createMockExecutionContext({
        accessToken: "expired-token",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.LECTEUR);
      const tokenInvalidError = new Error("Invalid token");
      tokenInvalidError.name = "JsonWebTokenError";
      mockJwtService.verify.mockImplementation(() => {
        throw tokenInvalidError;
      });

      const context = createMockExecutionContext({
        accessToken: "invalid-token",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException when token has no id", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.LECTEUR);
      const mockPayload = {
        login: "testuser",
        nom: "Doe",
        prenom: "John",
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "token-without-id",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should correctly identify admin role", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.ADMIN);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "admin",
        nom: "Admin",
        prenom: "User",
        isAdmin: true,
        isVeto: false,
        isEditeur: false,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "admin-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should correctly identify veto role", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.VETO);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "veto",
        nom: "Vet",
        prenom: "User",
        isAdmin: false,
        isVeto: true,
        isEditeur: false,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({ accessToken: "veto-token" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should correctly identify editeur role", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.EDITEUR);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "editeur",
        nom: "Editor",
        prenom: "User",
        isAdmin: false,
        isVeto: false,
        isEditeur: true,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "editor-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should correctly identify super admin role", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserRole.SUPER_ADMIN);
      const mockPayload: JwtPayload = {
        id: 1,
        login: "superadmin",
        nom: "Super",
        prenom: "Admin",
        isSuperAdmin: true,
        isAdmin: true,
        isVeto: false,
        isEditeur: false,
        isLecteur: true,
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext({
        accessToken: "superadmin-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
