import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: UsersService;

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

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
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

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMe", () => {
    it("should return current user info", async () => {
      const currentUser = {
        id: 1,
        login: "testuser",
        nom: "Doe",
        prenom: "John",
        role: 1,
        roleName: "Lecteur",
      };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getMe(currentUser);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe("findAll", () => {
    it("should return all users without pagination", async () => {
      const users = [mockUser, { ...mockUser, id: 2, login: "user2" }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll({});

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({});
    });

    it("should return paginated users", async () => {
      const paginatedResult = {
        data: [mockUser],
        meta: {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };
      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(paginatedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto = {
        login: "newuser",
        password: "password123",
        nom: "New",
        prenom: "User",
      };
      mockUsersService.create.mockResolvedValue({ id: 2 });

      const result = await controller.create(createUserDto);

      expect(result).toEqual({ id: 2 });
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateUserDto = { nom: "Updated", prenom: "Name" };
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, updateUserDto);

      expect(result).toEqual({ message: "Utilisateur mis à jour avec succès" });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      const currentUser = {
        id: 2,
        login: "admin",
        nom: "Admin",
        prenom: "User",
        role: 4,
        roleName: "Admin",
      };
      mockUsersService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1, currentUser);

      expect(result).toEqual({ message: "Utilisateur supprimé avec succès" });
      expect(mockUsersService.delete).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("restore", () => {
    it("should restore a deleted user", async () => {
      mockUsersService.restore.mockResolvedValue(undefined);

      const result = await controller.restore(1);

      expect(result).toEqual({ message: "Utilisateur restauré avec succès" });
      expect(mockUsersService.restore).toHaveBeenCalledWith(1);
    });
  });
});
