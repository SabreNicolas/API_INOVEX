import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Consigne, ConsigneType } from "../../entities";
import { ConsignesService } from "./consignes.service";

describe("ConsignesService", () => {
  let service: ConsignesService;

  const mockConsigneRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConsigneTypeRepository = {
    find: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQueryBuilder = (data: any[] = [], total = 0) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
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
        ConsignesService,
        {
          provide: getRepositoryToken(Consigne),
          useValue: mockConsigneRepository,
        },
        {
          provide: getRepositoryToken(ConsigneType),
          useValue: mockConsigneTypeRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ConsignesService>(ConsignesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return consignes without pagination", async () => {
      mockConsigneRepository.find.mockResolvedValue([{ id: 1, titre: "Test" }]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated consignes", async () => {
      mockConsigneRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(5);
    });
  });

  describe("findActiveOnDate", () => {
    it("should return active consignes without pagination", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockConsigneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findActiveOnDate(1, new Date("2024-06-15"));

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated active consignes", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }], 3);
      mockConsigneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findActiveOnDate(1, new Date("2024-06-15"), {
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByDateRange", () => {
    it("should return consignes in date range", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockConsigneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findInactive", () => {
    it("should return inactive consignes", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockConsigneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findInactive(1, new Date("2024-06-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findFuture", () => {
    it("should return future consignes", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockConsigneRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findFuture(1, new Date("2024-06-15"));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return a consigne by id", async () => {
      mockConsigneRepository.findOne.mockResolvedValue({
        id: 1,
        titre: "Test",
        idUsine: 1,
      });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockConsigneRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findTypes", () => {
    it("should return all consigne types", async () => {
      const types = [{ id: 1, libelle: "Sécurité" }];
      mockConsigneTypeRepository.find.mockResolvedValue(types);

      const result = await service.findTypes();

      expect(result).toEqual(types);
    });
  });

  describe("create", () => {
    it("should create a consigne and return id", async () => {
      mockConsigneRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create(
        { titre: "Nouvelle consigne" } as any,
        1
      );

      expect(result).toEqual({ id: 1 });
    });

    it("should create with file URL", async () => {
      mockConsigneRepository.save.mockResolvedValue({ id: 2 });

      const result = await service.create(
        { titre: "Consigne avec fichier" } as any,
        1,
        "/uploads/consignes/test.pdf"
      );

      expect(result).toEqual({ id: 2 });
    });
  });

  describe("update", () => {
    it("should update an existing consigne", async () => {
      mockConsigneRepository.findOne.mockResolvedValue({ id: 1, url: null });

      await expect(
        service.update(1, { titre: "Updated" } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when not found", async () => {
      mockConsigneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { titre: "Updated" } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
