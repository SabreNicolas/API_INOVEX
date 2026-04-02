import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Anomalie,
  ElementControle,
  Groupement,
  MesureRondier,
  QuartCalendrier,
  RepriseRonde,
  Ronde,
  ZoneControle,
} from "../../entities";
import { RondeService } from "./ronde.service";

describe("RondeService", () => {
  let service: RondeService;

  const mockRondeRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockZoneRepository = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const mockGroupementRepository = { createQueryBuilder: jest.fn() };
  const mockElementRepository = { createQueryBuilder: jest.fn() };
  const mockMesureRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockAnomalieRepository = { createQueryBuilder: jest.fn() };
  const mockCalendrierRepository = { createQueryBuilder: jest.fn() };
  const mockRepriseRondeRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
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
        RondeService,
        { provide: getRepositoryToken(Ronde), useValue: mockRondeRepository },
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
        {
          provide: getRepositoryToken(MesureRondier),
          useValue: mockMesureRepository,
        },
        {
          provide: getRepositoryToken(Anomalie),
          useValue: mockAnomalieRepository,
        },
        {
          provide: getRepositoryToken(QuartCalendrier),
          useValue: mockCalendrierRepository,
        },
        {
          provide: getRepositoryToken(RepriseRonde),
          useValue: mockRepriseRondeRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RondeService>(RondeService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByDateAndQuart", () => {
    it("should return empty when no rondes", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRondeRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findByDateAndQuart(1, "2026-01-01", 1);

      expect(result).toEqual([]);
    });

    it("should return rondes with details", async () => {
      const rondeQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      mockRondeRepository.createQueryBuilder.mockReturnValue(rondeQb);

      const calQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockCalendrierRepository.createQueryBuilder.mockReturnValue(calQb);

      mockZoneRepository.find.mockResolvedValue([{ id: 1, nom: "Zone A" }]);

      const groupQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockGroupementRepository.createQueryBuilder.mockReturnValue(groupQb);

      const elemQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockElementRepository.createQueryBuilder.mockReturnValue(elemQb);

      const mesureQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockMesureRepository.createQueryBuilder.mockReturnValue(mesureQb);

      const anomQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockAnomalieRepository.createQueryBuilder.mockReturnValue(anomQb);

      const result = await service.findByDateAndQuart(1, "2026-01-01", 1);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
