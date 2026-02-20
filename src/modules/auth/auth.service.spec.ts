import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as argon2 from "argon2";

import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  const mockUser = {
    id: 1,
    login: "admin",
    pwd: "hashedPassword",
    nom: "Doe",
    prenom: "John",
    isAdmin: true,
    isVeto: false,
    isEditeur: false,
    isLecteur: true,
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("refreshSecretKey"),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should throw UnauthorizedException if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ login: "unknown", password: "password" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is wrong", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(argon2, "verify").mockResolvedValue(false);

      await expect(
        service.login({ login: "admin", password: "wrongPassword" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return tokens and user on successful login", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(argon2, "verify").mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce("accessToken123")
        .mockReturnValueOnce("refreshToken123");

      const result = await service.login({
        login: "admin",
        password: "password",
      });

      expect(result).toHaveProperty("accessToken", "accessToken123");
      expect(result).toHaveProperty("refreshToken", "refreshToken123");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("pwd");
    });
  });

  describe("refreshTokens", () => {
    it("should throw if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(service.refreshTokens("badToken")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw if token type is not refresh", async () => {
      mockJwtService.verify.mockReturnValue({
        id: 1,
        type: "access",
      });

      await expect(service.refreshTokens("accessToken")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw if user no longer exists", async () => {
      mockJwtService.verify.mockReturnValue({
        id: 999,
        type: "refresh",
      });
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens("validToken")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should return new token pair when refresh token is valid", async () => {
      mockJwtService.verify.mockReturnValue({
        id: 1,
        type: "refresh",
      });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce("newAccessToken")
        .mockReturnValueOnce("newRefreshToken");

      const result = await service.refreshTokens("validRefreshToken");

      expect(result).toHaveProperty("accessToken", "newAccessToken");
      expect(result).toHaveProperty("refreshToken", "newRefreshToken");
    });
  });
});
