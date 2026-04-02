import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { ModeOperatoireController } from "./mode-operatoire.controller";
import { ModeOperatoireService } from "./mode-operatoire.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ModeOperatoireController", () => {
  let controller: ModeOperatoireController;

  const mockService = {
    findAll: jest.fn(),
    findByZone: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    login: "admin",
    nom: "Doe",
    prenom: "John",
    isAdmin: true,
    idUsine: 1,
    roles: [5],
    roleName: "Admin" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModeOperatoireController],
      providers: [{ provide: ModeOperatoireService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ModeOperatoireController>(ModeOperatoireController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service with idUsine", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("create", () => {
    it("should throw BadRequestException when no file", async () => {
      await expect(
        controller.create(
          { nom: "Test" } as any,
          mockCurrentUser as any,
          undefined as any
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should create with file", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("pdf"),
      } as any;
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { nom: "Test" } as any,
        mockCurrentUser as any,
        mockFile
      );

      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith(
        { nom: "Test" },
        mockFile,
        1
      );
    });
  });
});
