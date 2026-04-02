import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { ElementControleService } from "./element-controle.service";

describe("ElementControleService", () => {
  let service: ElementControleService;

  const mockElementRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockZoneRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGroupementRepository = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQueryBuilder = (data: any[] = [], total = 0) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(data),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElementControleService,
        {
          provide: getRepositoryToken(ElementControle),
          useValue: mockElementRepository,
        },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneRepository,
        },
        {
          provide: getRepositoryToken(Groupement),
          useValue: mockGroupementRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ElementControleService>(ElementControleService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return elements for zones of the usine", async () => {
      mockZoneRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const qb = createMockQueryBuilder([{ id: 1, nom: "Element" }]);
      mockElementRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty when no zones for usine", async () => {
      mockZoneRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });

    it("should return paginated result", async () => {
      mockZoneRepository.find.mockResolvedValue([{ id: 1 }]);
      const qb = createMockQueryBuilder([{ id: 1 }], 5);
      mockElementRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByZone", () => {
    it("should return elements for a specific zone", async () => {
      mockZoneRepository.findOne.mockResolvedValue({ id: 1, idUsine: 1 });
      mockElementRepository.find.mockResolvedValue([{ id: 1, nom: "Element" }]);

      const result = await service.findByZone(1, 1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw NotFoundException if zone not found for usine", async () => {
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findByZone(999, 1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findByGroupement", () => {
    it("should return elements for a groupement", async () => {
      mockGroupementRepository.findOne.mockResolvedValue({ id: 1, zoneId: 1 });
      mockZoneRepository.findOne.mockResolvedValue({ id: 1, idUsine: 1 });
      mockElementRepository.find.mockResolvedValue([{ id: 1, nom: "Element" }]);

      const result = await service.findByGroupement(1, 1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw NotFoundException if groupement not found", async () => {
      mockGroupementRepository.findOne.mockResolvedValue(null);

      await expect(service.findByGroupement(999, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException if zone not accessible for usine", async () => {
      mockGroupementRepository.findOne.mockResolvedValue({ id: 1, zoneId: 1 });
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findByGroupement(1, 999)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findOne", () => {
    it("should return an element by id", async () => {
      mockElementRepository.findOne.mockResolvedValue({ id: 1, zoneId: 1 });
      mockZoneRepository.findOne.mockResolvedValue({ id: 1, idUsine: 1 });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException when not found", async () => {
      mockElementRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create and return id", async () => {
      mockElementRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create({
        nom: "Element test",
        zoneId: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
