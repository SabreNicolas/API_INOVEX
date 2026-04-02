import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ActionEnregistrement,
  QuartAction,
  QuartCalendrier,
  ZoneControle,
} from "../../entities";
import { QuartCalendrierService } from "./quart-calendrier.service";

describe("QuartCalendrierService", () => {
  let service: QuartCalendrierService;

  const mockCalendrierRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockActionRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };

  const mockActionEnregistrementRepository = {};
  const mockZoneRepository = {};

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQb = (result: any = null) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result),
    getMany: jest.fn().mockResolvedValue(result || []),
    getOne: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuartCalendrierService,
        {
          provide: getRepositoryToken(QuartCalendrier),
          useValue: mockCalendrierRepository,
        },
        {
          provide: getRepositoryToken(QuartAction),
          useValue: mockActionRepository,
        },
        {
          provide: getRepositoryToken(ActionEnregistrement),
          useValue: mockActionEnregistrementRepository,
        },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<QuartCalendrierService>(QuartCalendrierService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findHorairesByDateAndQuart", () => {
    it("should return horaires", async () => {
      const qb = createMockQb({
        date_heure_debut: "2026-01-01T06:00:00",
        date_heure_fin: "2026-01-01T14:00:00",
      });
      mockCalendrierRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findHorairesByDateAndQuart(
        1,
        "2026-01-01",
        1
      );

      expect(result).toHaveProperty("date_heure_debut");
      expect(result).toHaveProperty("date_heure_fin");
    });

    it("should return nulls when no data", async () => {
      const qb = createMockQb(null);
      mockCalendrierRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findHorairesByDateAndQuart(
        1,
        "2026-01-01",
        1
      );

      expect(result.date_heure_debut).toBeNull();
      expect(result.date_heure_fin).toBeNull();
    });
  });

  describe("findByDateRange", () => {
    it("should return entries", async () => {
      const qb = createMockQb([{ id: 1 }]);
      mockCalendrierRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByDateRange(
        1,
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return entry", async () => {
      mockCalendrierRepository.findOne.mockResolvedValue({ id: 1, idUsine: 1 });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockCalendrierRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
