import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as argon2 from "argon2";

import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { UsersService } from "./users.service";

jest.mock("argon2");

describe("UsersService", () => {
  let service: UsersService;

  const mockUser = {
    id: 1,
    login: "testuser",
    pwd: "hashedPassword",
    nom: "Doe",
    prenom: "John",
    isAdmin: false,
    isVeto: false,
    isEditeur: true,
    isLecteur: true,
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
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
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of users without pagination", async () => {
      mockUserRepository.find.mockResolvedValue([
        mockUser,
        { ...mockUser, id: 2, login: "user2" },
      ]);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect((result as any[])[0].login).toBe("testuser");
    });

    it("should return paginated result when pagination is provided", async () => {
      mockUserRepository.findAndCount.mockResolvedValue([
        [mockUser, { ...mockUser, id: 2 }],
        5,
      ]);

      const result = await service.findAll({ page: 1, limit: 2 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(5);
      expect((result as any).meta.page).toBe(1);
      expect((result as any).meta.limit).toBe(2);
    });

    it("should return empty array when no users", async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.login).toBe("testuser");
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing login
      mockUserRepository.create.mockReturnValue({ ...mockUser, id: 5 });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, id: 5 });

      (argon2.hash as jest.Mock).mockResolvedValue("hashedPassword");

      const createDto = {
        login: "newuser",
        password: "password123",
        nom: "New",
        prenom: "User",
        isEditeur: true,
      };

      const result = await service.create(createDto);

      expect(result.id).toBe(5);
      expect(argon2.hash).toHaveBeenCalledWith("password123");
    });

    it("should throw BadRequestException when login already exists", async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1 }); // Existing user

      const createDto = {
        login: "existinguser",
        password: "password123",
        nom: "Existing",
        prenom: "User",
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("update", () => {
    it("should update an existing user", async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // Check user exists
        .mockResolvedValueOnce(null); // No duplicate login

      const updateDto = { nom: "Updated", prenom: "Name" };

      await expect(service.update(1, updateDto)).resolves.not.toThrow();
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { nom: "Test" })).rejects.toThrow(
        NotFoundException
      );
    });

    it("should hash password when updating password", async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null); // No duplicate login

      (argon2.hash as jest.Mock).mockResolvedValue("newHashedPassword");

      await service.update(1, { password: "newpassword" });

      expect(argon2.hash).toHaveBeenCalledWith("newpassword");
    });

    it("should throw BadRequestException when no data to update", async () => {
      // Reset and reconfigure the mock explicitly for this test
      mockUserRepository.findOne.mockReset();
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 1,
        login: "testuser",
      });

      await expect(service.update(1, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("should soft delete an existing user", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.delete(1, 2)).resolves.not.toThrow(); // currentUserId = 2

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999, 1)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when trying to delete own account", async () => {
      await expect(service.delete(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
