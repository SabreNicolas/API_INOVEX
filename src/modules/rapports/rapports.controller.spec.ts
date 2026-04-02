import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { RapportsController } from "./rapports.controller";
import { RapportsService } from "./rapports.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("RapportsController", () => {
  let controller: RapportsController;

  const mockRapportsService = {
    findByUsine: jest.fn(),
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
    isRondier: false,
    isSaisie: false,
    isQSE: false,
    isRapport: true,
    isAdmin: false,
    isChefQuart: false,
    isSuperAdmin: false,
    isKerlan: false,
    idUsine: 1,
    roles: [3],
    roleName: "Rapport" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RapportsController],
      providers: [
        { provide: RapportsService, useValue: mockRapportsService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<RapportsController>(RapportsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return rapports for the user's usine", async () => {
      const rapports = [{ id: 1, nom: "Rapport mensuel", idUsine: 1 }];
      mockRapportsService.findByUsine.mockResolvedValue(rapports);

      const result = await controller.findAll(mockCurrentUser as any, {});

      expect(result).toEqual(rapports);
      expect(mockRapportsService.findByUsine).toHaveBeenCalledWith(1, {});
    });

    it("should pass pagination to service", async () => {
      const paginatedResult = {
        data: [{ id: 1, nom: "Rapport" }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      mockRapportsService.findByUsine.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(mockCurrentUser as any, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(paginatedResult);
      expect(mockRapportsService.findByUsine).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
    });
  });
});
