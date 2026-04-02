import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { ArretsController } from "./arrets.controller";
import { ArretsService } from "./arrets.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ArretsController", () => {
  let controller: ArretsController;

  const mockArretsService = {
    findTotalsByDateRange: jest.fn(),
    findByDateRange: jest.fn(),
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
    isRondier: false,
    isSaisie: true,
    isQSE: false,
    isRapport: false,
    isAdmin: true,
    isChefQuart: false,
    isSuperAdmin: false,
    isKerlan: false,
    idUsine: 1,
    roles: [5],
    roleName: "Admin" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArretsController],
      providers: [
        { provide: ArretsService, useValue: mockArretsService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ArretsController>(ArretsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findTotalsByDateRange", () => {
    it("should return totals", async () => {
      const totals = [{ ligne: "Ligne 1", totalArrets: 3, totalHeures: 5 }];
      mockArretsService.findTotalsByDateRange.mockResolvedValue(totals);

      const result = await controller.findTotalsByDateRange(
        "2024-01-01",
        "2024-12-31",
        mockCurrentUser as any
      );

      expect(result).toEqual(totals);
    });
  });

  describe("findByDateRange", () => {
    it("should return arrets by date range", async () => {
      const data = [{ ligne: "Ligne 1", arrets: [] }];
      mockArretsService.findByDateRange.mockResolvedValue(data);

      const result = await controller.findByDateRange(
        { startDate: "2024-01-01", endDate: "2024-12-31" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual(data);
    });
  });

  describe("create", () => {
    it("should create an arret", async () => {
      mockArretsService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { productId: 1, date_heure_debut: "2024-01-01" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      mockArretsService.update.mockResolvedValue(undefined);

      const result = await controller.update(
        1,
        { description: "Updated" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ message: "Arrêt mis à jour avec succès" });
    });
  });

  describe("delete", () => {
    it("should delete and return message", async () => {
      mockArretsService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1, mockCurrentUser as any);

      expect(result).toEqual({ message: "Arrêt supprimé avec succès" });
    });
  });
});
