import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { ZoneControleService } from "./zone-controle.service";

describe("ZoneControleService", () => {
  let service: ZoneControleService;

  const mockZoneRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockGroupementRepository = {};
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
        ZoneControleService,
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneRepository,
        },
        {
          provide: getRepositoryToken(Groupement),
          useValue: mockGroupementRepository,
        },
        {
          provide: getRepositoryToken(ElementControle),
          useValue: mockElementRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ZoneControleService>(ZoneControleService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all zones without pagination", async () => {
      mockZoneRepository.find.mockResolvedValue([{ id: 1, nom: "Zone A" }]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(mockZoneRepository.find).toHaveBeenCalledWith({
        where: { idUsine: 1 },
        order: { nom: "ASC" },
      });
    });

    it("should return paginated result", async () => {
      mockZoneRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findOne", () => {
    it("should return zone by id and usine", async () => {
      mockZoneRepository.findOne.mockResolvedValue({
        id: 1,
        nom: "Zone A",
        idUsine: 1,
      });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create zone and return id", async () => {
      mockZoneRepository.save.mockResolvedValue({ id: 1, nom: "Zone A" });

      const result = await service.create({
        nom: "Zone A",
        idUsine: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update zone", async () => {
      mockZoneRepository.findOne.mockResolvedValue({ id: 1, nom: "Zone A" });

      await service.update(1, { nom: "Zone B" } as any);

      expect(mockZoneRepository.update).toHaveBeenCalledWith(1, {
        nom: "Zone B",
      });
    });

    it("should throw NotFoundException when zone not found", async () => {
      mockZoneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { nom: "Zone B" } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
