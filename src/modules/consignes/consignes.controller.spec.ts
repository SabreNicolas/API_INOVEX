import { Test, TestingModule } from "@nestjs/testing";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { ConsignesController } from "./consignes.controller";
import { ConsignesService } from "./consignes.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ConsignesController", () => {
  let controller: ConsignesController;

  const mockConsignesService = {
    findAll: jest.fn(),
    findActiveOnDate: jest.fn(),
    findByDateRange: jest.fn(),
    findInactive: jest.fn(),
    findFuture: jest.fn(),
    findTypes: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFileUploadService = {
    validateFile: jest.fn(),
    saveConsigneFile: jest.fn(),
    deleteFile: jest.fn(),
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
    isSaisie: false,
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
      controllers: [ConsignesController],
      providers: [
        { provide: ConsignesService, useValue: mockConsignesService },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ConsignesController>(ConsignesController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return consignes for the user's usine", async () => {
      const consignes = [{ id: 1, titre: "Test" }];
      mockConsignesService.findAll.mockResolvedValue(consignes);

      const result = await controller.findAll({}, mockCurrentUser as any);

      expect(result).toEqual(consignes);
      expect(mockConsignesService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findActiveOnDate", () => {
    it("should return active consignes on a date", async () => {
      const consignes = [{ id: 1 }];
      mockConsignesService.findActiveOnDate.mockResolvedValue(consignes);

      const result = await controller.findActiveOnDate(
        { date: "2024-06-15", page: 1, limit: 10 } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual(consignes);
    });
  });

  describe("findByDateRange", () => {
    it("should return consignes in a date range", async () => {
      const consignes = [{ id: 1 }];
      mockConsignesService.findByDateRange.mockResolvedValue(consignes);

      const result = await controller.findByDateRange(
        { dateDebut: "2024-01-01", dateFin: "2024-12-31" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual(consignes);
    });
  });

  describe("findTypes", () => {
    it("should return all consigne types", async () => {
      const types = [{ id: 1, libelle: "Sécurité" }];
      mockConsignesService.findTypes.mockResolvedValue(types);

      const result = await controller.findTypes();

      expect(result).toEqual(types);
    });
  });
});
