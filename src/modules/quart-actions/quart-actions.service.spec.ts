import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ActionEnregistrement, QuartAction } from "../../entities";
import { QuartActionsService } from "./quart-actions.service";

describe("QuartActionsService", () => {
  let service: QuartActionsService;

  const mockActionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEnregistrementRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQb = (data: any[] = []) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(data),
    getManyAndCount: jest.fn().mockResolvedValue([data, data.length]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuartActionsService,
        {
          provide: getRepositoryToken(QuartAction),
          useValue: mockActionRepository,
        },
        {
          provide: getRepositoryToken(ActionEnregistrement),
          useValue: mockEnregistrementRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<QuartActionsService>(QuartActionsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAllEnregistrements", () => {
    it("should return enregistrements for usine", async () => {
      mockEnregistrementRepository.find.mockResolvedValue([
        { id: 1, nom: "Action" },
      ]);

      const result = await service.findAllEnregistrements(1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findAll", () => {
    it("should return all without pagination", async () => {
      mockActionRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockActionRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findActiveOnDate", () => {
    it("should return active actions", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockActionRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findActiveOnDate(1, new Date("2026-01-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findByDateRange", () => {
    it("should return actions by date range", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockActionRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByDateRange(
        1,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findFuture", () => {
    it("should return future actions", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockActionRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findFuture(1, new Date("2026-01-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return action", async () => {
      mockActionRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockActionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
