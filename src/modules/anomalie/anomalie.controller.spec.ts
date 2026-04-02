import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { AnomalieController } from "./anomalie.controller";
import { AnomalieService } from "./anomalie.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("AnomalieController", () => {
  let controller: AnomalieController;

  const mockAnomalieService = {
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

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
    isKerlan: false,
    idUsine: 1,
    roles: [5],
    roleName: "Admin" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnomalieController],
      providers: [
        { provide: AnomalieService, useValue: mockAnomalieService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<AnomalieController>(AnomalieController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return anomalies for the user's usine", async () => {
      const anomalies = [{ id: 1, commentaire: "Test" }];
      mockAnomalieService.findAll.mockResolvedValue(anomalies);

      const result = await controller.findAll({}, mockCurrentUser as any);

      expect(result).toEqual(anomalies);
      expect(mockAnomalieService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      mockAnomalieService.update.mockResolvedValue(undefined);

      const result = await controller.update(1, {
        commentaire: "Updated",
      } as any);

      expect(result).toEqual({ message: "Anomalie mise à jour avec succès" });
      expect(mockAnomalieService.update).toHaveBeenCalledWith(1, {
        commentaire: "Updated",
      });
    });
  });
});
