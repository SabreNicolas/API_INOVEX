import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { GroupementService } from "./groupement.service";

describe("GroupementService", () => {
  let service: GroupementService;

  const mockGroupementRepository = {
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
  };

  const mockElementRepository = {};

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupementService,
        {
          provide: getRepositoryToken(Groupement),
          useValue: mockGroupementRepository,
        },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneRepository,
        },
        {
          provide: getRepositoryToken(ElementControle),
          useValue: mockElementRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<GroupementService>(GroupementService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return groupements for usine zones", async () => {
      mockZoneRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, groupement: "G1" }]),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };
      mockGroupementRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty when no zones", async () => {
      mockZoneRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });

    it("should return paginated result", async () => {
      mockZoneRepository.find.mockResolvedValue([{ id: 1 }]);
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 5]),
      };
      mockGroupementRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByZone", () => {
    it("should return groupements for zone", async () => {
      mockGroupementRepository.find.mockResolvedValue([{ id: 1, zoneId: 1 }]);

      const result = await service.findByZone(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockGroupementRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 3]);

      const result = await service.findByZone(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findOne", () => {
    it("should return groupement", async () => {
      mockGroupementRepository.findOne.mockResolvedValue({
        id: 1,
        groupement: "G1",
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockGroupementRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create and return id", async () => {
      mockGroupementRepository.save.mockResolvedValue({
        id: 1,
        groupement: "G1",
      });

      const result = await service.create({
        groupement: "G1",
        zoneId: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
