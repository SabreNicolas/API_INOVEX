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
    Id: 1,
    login: "testuser",
    Nom: "Doe",
    Prenom: "John",
    email: "test@test.com",
    loginGMAO: "",
    posteUser: "",
    isAdmin: false,
    isRondier: true,
    isSaisie: false,
    isQSE: false,
    isRapport: false,
    isChefQuart: false,
    isSuperAdmin: false,
    isMail: false,
    isActif: true,
    idUsine: 1,
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

  const mockCurrentUser = {
    id: 1,
    login: "testuser",
    nom: "Doe",
    prenom: "John",
    isRondier: true,
    isSaisie: false,
    isQSE: false,
    isRapport: false,
    isAdmin: true,
    isChefQuart: false,
    isSuperAdmin: false,
    idUsine: 1,
    role: 5,
    roleName: "Admin" as const,
  };

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all users without pagination", async () => {
      const users = [mockUser, { ...mockUser, Id: 2, login: "user2" }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll({}, mockCurrentUser);

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({}, 1);
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

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        mockCurrentUser
      );

      expect(result).toEqual(paginatedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        1
      );
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

      const result = await controller.create(createUserDto, mockCurrentUser);

      expect(result).toEqual({ id: 2 });
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto, 1);
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateUserDto = { nom: "Updated", prenom: "Name" };
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, updateUserDto, mockCurrentUser);

      expect(result).toEqual({ message: "Utilisateur mis à jour avec succès" });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto, 1);
    });
  });
});
