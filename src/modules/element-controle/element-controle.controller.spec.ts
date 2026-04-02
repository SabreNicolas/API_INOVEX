import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControleController } from "./element-controle.controller";
import { ElementControleService } from "./element-controle.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ElementControleController", () => {
  let controller: ElementControleController;

  const mockService = {
    findAll: jest.fn(),
    findByZone: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
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
      controllers: [ElementControleController],
      providers: [
        { provide: ElementControleService, useValue: mockService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ElementControleController>(
      ElementControleController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return elements", async () => {
      const elements = [{ id: 1, nom: "Element" }];
      mockService.findAll.mockResolvedValue(elements);

      const result = await controller.findAll({}, mockCurrentUser as any);

      expect(result).toEqual(elements);
      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findByZone", () => {
    it("should return elements for a zone", async () => {
      const elements = [{ id: 1, nom: "Element", zoneId: 1 }];
      mockService.findByZone.mockResolvedValue(elements);

      const result = await controller.findByZone(1, {}, mockCurrentUser as any);

      expect(result).toEqual(elements);
    });
  });

  describe("create", () => {
    it("should create an element", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({
        nom: "New element",
        zoneId: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(
        1,
        { nom: "Updated" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({
        message: "Élément de contrôle mis à jour avec succès",
      });
    });
  });

  describe("delete", () => {
    it("should delete and return message", async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1, mockCurrentUser as any);

      expect(result).toEqual({
        message: "Élément de contrôle supprimé avec succès",
      });
    });
  });
});
