import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartActualite } from "../../entities";
import { QuartActualiteService } from "./quart-actualite.service";

describe("QuartActualiteService", () => {
  let service: QuartActualiteService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQb = (data: any[] = [], total = 0) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(data),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuartActualiteService,
        {
          provide: getRepositoryToken(QuartActualite),
          useValue: mockRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<QuartActualiteService>(QuartActualiteService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all without pagination", async () => {
      mockRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { idUsine: 1, isActive: 1 },
        order: { id: "DESC" },
      });
    });

    it("should return paginated result", async () => {
      mockRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findActiveOnDate", () => {
    it("should return active actualites on date", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findActiveOnDate(1, new Date("2026-01-01"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findByDateRange", () => {
    it("should return actualites in date range", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByDateRange(
        1,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findInactive", () => {
    it("should return inactive actualites", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findInactive(1, new Date("2026-01-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findFuture", () => {
    it("should return future actualites", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findFuture(1, new Date("2026-01-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
