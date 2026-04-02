import { Test, TestingModule } from "@nestjs/testing";

import { GroupementController } from "./groupement.controller";
import { GroupementService } from "./groupement.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("GroupementController", () => {
  let controller: GroupementController;

  const mockService = {
    findAll: jest.fn(),
    findByZone: jest.fn(),
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
      controllers: [GroupementController],
      providers: [{ provide: GroupementService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<GroupementController>(GroupementController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service with idUsine and pagination", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findByZone", () => {
    it("should delegate to service", async () => {
      mockService.findByZone.mockResolvedValue([]);

      await controller.findByZone(1, {} as any);

      expect(mockService.findByZone).toHaveBeenCalledWith(1, {});
    });
  });

  describe("create", () => {
    it("should create groupement", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({
        groupement: "G1",
        zoneId: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, {
        groupement: "Updated",
      } as any);

      expect(result).toEqual({ message: "Groupement mis à jour avec succès" });
    });
  });

  describe("delete", () => {
    it("should return message", async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1);

      expect(result).toEqual({ message: "Groupement supprimé avec succès" });
    });
  });
});
