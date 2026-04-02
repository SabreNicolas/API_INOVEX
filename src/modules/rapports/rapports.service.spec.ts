import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Rapport } from "../../entities";
import { RapportsService } from "./rapports.service";

describe("RapportsService", () => {
  let service: RapportsService;

  const mockRapportRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RapportsService,
        {
          provide: getRepositoryToken(Rapport),
          useValue: mockRapportRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RapportsService>(RapportsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByUsine", () => {
    const mockRapport = {
      id: 1,
      nom: "Facturation mensuelle",
      idUsine: 1,
      url: "http://example.com",
    };

    it("should return all rapports without pagination", async () => {
      mockRapportRepository.find.mockResolvedValue([mockRapport]);

      const result = await service.findByUsine(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockRapportRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idUsine: 1 } })
      );
    });

    it("should return paginated result when pagination is provided", async () => {
      mockRapportRepository.findAndCount.mockResolvedValue([[mockRapport], 1]);

      const result = await service.findByUsine(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(1);
      expect((result as any).meta.page).toBe(1);
    });

    it("should return empty array when no rapports", async () => {
      mockRapportRepository.find.mockResolvedValue([]);

      const result = await service.findByUsine(1);

      expect(result).toHaveLength(0);
    });

    it("should rethrow errors and log them", async () => {
      const error = new Error("DB error");
      mockRapportRepository.findAndCount.mockRejectedValue(error);

      await expect(
        service.findByUsine(1, { page: 1, limit: 10 })
      ).rejects.toThrow("DB error");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
