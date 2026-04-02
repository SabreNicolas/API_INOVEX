import { Test, TestingModule } from "@nestjs/testing";

import { ZoneControleController } from "./zone-controle.controller";
import { ZoneControleService } from "./zone-controle.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ZoneControleController", () => {
  let controller: ZoneControleController;

  const mockService = {
    findAll: jest.fn(),
    findAllWithGroupementsAndElements: jest.fn(),
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
      controllers: [ZoneControleController],
      providers: [{ provide: ZoneControleService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ZoneControleController>(ZoneControleController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findAllWithGroupementsAndElements", () => {
    it("should delegate to service", async () => {
      mockService.findAllWithGroupementsAndElements.mockResolvedValue([]);

      await controller.findAllWithGroupementsAndElements(
        mockCurrentUser as any
      );

      expect(
        mockService.findAllWithGroupementsAndElements
      ).toHaveBeenCalledWith(1);
    });
  });

  describe("create", () => {
    it("should create zone", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({
        nom: "Zone A",
        idUsine: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, { nom: "Zone B" } as any);

      expect(result).toEqual({
        message: "Zone de contrôle mise à jour avec succès",
      });
    });
  });

  describe("delete", () => {
    it("should return message", async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1);

      expect(result).toEqual({
        message: "Zone de contrôle supprimée avec succès",
      });
    });
  });
});
