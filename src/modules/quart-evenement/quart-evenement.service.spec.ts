import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement } from "../../entities";
import { QuartEvenementService } from "./quart-evenement.service";

describe("QuartEvenementService", () => {
  let service: QuartEvenementService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuartEvenementService,
        {
          provide: getRepositoryToken(QuartEvenement),
          useValue: mockRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<QuartEvenementService>(QuartEvenementService);
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
    });

    it("should return paginated result", async () => {
      mockRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByDateRange", () => {
    it("should return evenements by date range", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByDateRange(
        1,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return evenement", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create evenement and return id", async () => {
      mockRepository.save.mockResolvedValue({ id: 1, titre: "Test" });

      const result = await service.create(
        {
          titre: "Event",
          date_heure_debut: "2026-01-01",
          date_heure_fin: "2026-01-02",
        } as any,
        1
      );

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update evenement", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, idUsine: 1 });

      await service.update(1, 1, { titre: "Updated" } as any);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        titre: "Updated",
      });
    });

    it("should throw NotFoundException when not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, 1, { titre: "Updated" } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
