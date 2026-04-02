import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { AdminKerlanController } from "./admin-kerlan.controller";
import { AdminKerlanService } from "./admin-kerlan.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("AdminKerlanController", () => {
  let controller: AdminKerlanController;

  const mockAdminKerlanService = {
    findAllSites: jest.fn(),
    findOneSite: jest.fn(),
    createSite: jest.fn(),
    updateSite: jest.fn(),
    findAllConsigneTypes: jest.fn(),
    findOneConsigneType: jest.fn(),
    createConsigneType: jest.fn(),
    updateConsigneType: jest.fn(),
    deleteConsigneType: jest.fn(),
    findAllQuartEvenementCauses: jest.fn(),
    findOneQuartEvenementCause: jest.fn(),
    createQuartEvenementCause: jest.fn(),
    updateQuartEvenementCause: jest.fn(),
    deleteQuartEvenementCause: jest.fn(),
    findAllRapports: jest.fn(),
    findOneRapport: jest.fn(),
    createRapport: jest.fn(),
    updateRapport: jest.fn(),
    deleteRapport: jest.fn(),
    findAllPostesRondier: jest.fn(),
    findOnePosteRondier: jest.fn(),
    createPosteRondier: jest.fn(),
    updatePosteRondier: jest.fn(),
    deletePosteRondier: jest.fn(),
    findAllConversions: jest.fn(),
    findOneConversion: jest.fn(),
    createConversion: jest.fn(),
    updateConversion: jest.fn(),
    deleteConversion: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminKerlanController],
      providers: [
        { provide: AdminKerlanService, useValue: mockAdminKerlanService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<AdminKerlanController>(AdminKerlanController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ==================== SITES ====================

  describe("findAllSites", () => {
    it("should return all sites", async () => {
      const sites = [{ id: 1, localisation: "COUVIN" }];
      mockAdminKerlanService.findAllSites.mockResolvedValue(sites);

      const result = await controller.findAllSites({});

      expect(result).toEqual(sites);
      expect(mockAdminKerlanService.findAllSites).toHaveBeenCalledWith({});
    });
  });

  describe("findOneSite", () => {
    it("should return a single site", async () => {
      const site = { id: 1, localisation: "COUVIN" };
      mockAdminKerlanService.findOneSite.mockResolvedValue(site);

      const result = await controller.findOneSite(1);

      expect(result).toEqual(site);
    });
  });

  describe("createSite", () => {
    it("should create a site", async () => {
      mockAdminKerlanService.createSite.mockResolvedValue({ id: 1 });

      const result = await controller.createSite({
        localisation: "COUVIN",
        codeUsine: "CVN",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("updateSite", () => {
    it("should update a site and return message", async () => {
      mockAdminKerlanService.updateSite.mockResolvedValue(undefined);

      const result = await controller.updateSite(1, {
        localisation: "NEW",
      } as any);

      expect(result).toEqual({ message: "Site mis à jour avec succès" });
    });
  });

  // ==================== CONSIGNE TYPES ====================

  describe("findAllConsigneTypes", () => {
    it("should return consigne types", async () => {
      const types = [{ id: 1, libelle: "Sécurité" }];
      mockAdminKerlanService.findAllConsigneTypes.mockResolvedValue(types);

      const result = await controller.findAllConsigneTypes({});

      expect(result).toEqual(types);
    });
  });

  describe("createConsigneType", () => {
    it("should create a consigne type", async () => {
      mockAdminKerlanService.createConsigneType.mockResolvedValue({ id: 1 });

      const result = await controller.createConsigneType({
        libelle: "Sécurité",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("updateConsigneType", () => {
    it("should update and return message", async () => {
      mockAdminKerlanService.updateConsigneType.mockResolvedValue(undefined);

      const result = await controller.updateConsigneType(1, {
        libelle: "Updated",
      } as any);

      expect(result).toEqual({
        message: "Type de consigne mis à jour avec succès",
      });
    });
  });

  describe("deleteConsigneType", () => {
    it("should delete a consigne type", async () => {
      mockAdminKerlanService.deleteConsigneType.mockResolvedValue(undefined);

      await expect(controller.deleteConsigneType(1)).resolves.not.toThrow();
    });
  });

  // ==================== QUART EVENEMENT CAUSES ====================

  describe("findAllQuartEvenementCauses", () => {
    it("should return causes", async () => {
      const causes = [{ id: 1, libelle: "Panne" }];
      mockAdminKerlanService.findAllQuartEvenementCauses.mockResolvedValue(
        causes
      );

      const result = await controller.findAllQuartEvenementCauses({});

      expect(result).toEqual(causes);
    });
  });

  describe("updateQuartEvenementCause", () => {
    it("should update and return message", async () => {
      mockAdminKerlanService.updateQuartEvenementCause.mockResolvedValue(
        undefined
      );

      const result = await controller.updateQuartEvenementCause(1, {
        libelle: "Updated",
      } as any);

      expect(result).toEqual({
        message: "Cause d'événement mise à jour avec succès",
      });
    });
  });
});
