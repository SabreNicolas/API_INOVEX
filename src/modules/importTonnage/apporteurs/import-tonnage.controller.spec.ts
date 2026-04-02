import { Test, TestingModule } from "@nestjs/testing";

import { ImportTonnageController } from "./import-tonnage.controller";
import { ImportTonnageService } from "./import-tonnage.service";
import { AuthGuard } from "../../../common/guards/auth.guard";

describe("ImportTonnageController", () => {
  let controller: ImportTonnageController;

  const mockService = {
    findAll: jest.fn(),
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
      controllers: [ImportTonnageController],
      providers: [{ provide: ImportTonnageService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ImportTonnageController>(ImportTonnageController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith({}, 1);
    });
  });

  describe("create", () => {
    it("should delegate to service", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({ nomImport: "Test" } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
