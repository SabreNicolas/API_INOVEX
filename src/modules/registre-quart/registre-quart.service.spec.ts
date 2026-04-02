import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  AffectationEquipe,
  Anomalie,
  Consigne,
  Equipe,
  QuartActualite,
  QuartCalendrier,
  QuartEvenement,
  Site,
} from "@/entities";

import { RegistreQuartService } from "./registre-quart.service";

describe("RegistreQuartService", () => {
  let service: RegistreQuartService;

  const mockEquipeRepository = {
    createQueryBuilder: jest.fn(),
  };
  const mockAffectationRepository = { find: jest.fn() };
  const mockEvenementRepository = { createQueryBuilder: jest.fn() };
  const mockConsigneRepository = { createQueryBuilder: jest.fn() };
  const mockCalendrierRepository = { createQueryBuilder: jest.fn() };
  const mockActualiteRepository = { createQueryBuilder: jest.fn() };
  const mockAnomalieRepository = { createQueryBuilder: jest.fn() };
  const mockSiteRepository = { findOne: jest.fn() };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistreQuartService,
        { provide: getRepositoryToken(Equipe), useValue: mockEquipeRepository },
        {
          provide: getRepositoryToken(AffectationEquipe),
          useValue: mockAffectationRepository,
        },
        {
          provide: getRepositoryToken(QuartEvenement),
          useValue: mockEvenementRepository,
        },
        {
          provide: getRepositoryToken(Consigne),
          useValue: mockConsigneRepository,
        },
        {
          provide: getRepositoryToken(QuartCalendrier),
          useValue: mockCalendrierRepository,
        },
        {
          provide: getRepositoryToken(QuartActualite),
          useValue: mockActualiteRepository,
        },
        {
          provide: getRepositoryToken(Anomalie),
          useValue: mockAnomalieRepository,
        },
        { provide: getRepositoryToken(Site), useValue: mockSiteRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RegistreQuartService>(RegistreQuartService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLastShift", () => {
    it("should return last shift date and quart", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ date: "2026-01-15", quart: 2 }),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLastShift(1);

      expect(result).toEqual({ date: "2026-01-15", quart: 2 });
    });

    it("should return null when no equipe found", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLastShift(1);

      expect(result).toBeNull();
    });
  });

  describe("getRegistreData", () => {
    it("should throw NotFoundException when site not found", async () => {
      mockSiteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getRegistreData(999, "2026-01-15", 1, "John Doe")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
