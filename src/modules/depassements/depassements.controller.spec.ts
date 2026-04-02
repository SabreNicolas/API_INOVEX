import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { DepassementsController } from "./depassements.controller";
import { DepassementsService } from "./depassements.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("DepassementsController", () => {
  let controller: DepassementsController;

  const mockDepassementsService = {
    findChoixWithProduits: jest.fn(),
    findTotalsByDateRange: jest.fn(),
    findByDateRange: jest.fn(),
    findAllChoixDepassement: jest.fn(),
    findAllChoixDepassementProduit: jest.fn(),
    findAllDepassementProduit: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createChoixDepassement: jest.fn(),
    createChoixDepassementProduit: jest.fn(),
    createDepassementProduit: jest.fn(),
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
      controllers: [DepassementsController],
      providers: [
        { provide: DepassementsService, useValue: mockDepassementsService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<DepassementsController>(DepassementsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findChoixWithProduits", () => {
    it("should return choix with produits", async () => {
      const data = [{ id: 1, nom: "Choix A", produits: [] }];
      mockDepassementsService.findChoixWithProduits.mockResolvedValue(data);

      const result = await controller.findChoixWithProduits();

      expect(result).toEqual(data);
    });
  });

  describe("findTotalsByDateRange", () => {
    it("should return totals", async () => {
      const totals = [{ ligne: "ligne 1", totalDepassements: 5 }];
      mockDepassementsService.findTotalsByDateRange.mockResolvedValue(totals);

      const result = await controller.findTotalsByDateRange(
        "2024-01-01",
        "2024-12-31",
        mockCurrentUser as any
      );

      expect(result).toEqual(totals);
    });
  });

  describe("findByDateRange", () => {
    it("should return depassements by date range", async () => {
      const data = [{ ligne: "ligne 1", depassements: [] }];
      mockDepassementsService.findByDateRange.mockResolvedValue(data);

      const result = await controller.findByDateRange(
        { startDate: "2024-01-01", endDate: "2024-12-31" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual(data);
    });
  });

  describe("findAllChoixDepassement", () => {
    it("should return choix", async () => {
      const choix = [{ id: 1, nom: "Type A" }];
      mockDepassementsService.findAllChoixDepassement.mockResolvedValue(choix);

      const result = await controller.findAllChoixDepassement();

      expect(result).toEqual(choix);
    });
  });
});
