import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { AffectationEquipe, Equipe } from "../../entities";
import { EquipeService } from "./equipe.service";

describe("EquipeService", () => {
  let service: EquipeService;

  const mockEquipeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAffectationRepository = {
    find: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
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
        EquipeService,
        { provide: getRepositoryToken(Equipe), useValue: mockEquipeRepository },
        {
          provide: getRepositoryToken(AffectationEquipe),
          useValue: mockAffectationRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EquipeService>(EquipeService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return equipes with affectations", async () => {
      mockAffectationRepository.find.mockResolvedValue([
        { idEquipe: 1, id: 1, rondier: { idUsine: 1 } },
        { idEquipe: 1, id: 2, rondier: { idUsine: 1 } },
      ]);
      mockEquipeRepository.findByIds.mockResolvedValue([
        { id: 1, equipe: "Equipe A" },
      ]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("should return empty when no affectations", async () => {
      mockAffectationRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return equipe with affectations", async () => {
      mockEquipeRepository.findOne.mockResolvedValue({
        id: 1,
        equipe: "Equipe A",
      });
      mockAffectationRepository.find.mockResolvedValue([
        { id: 1, idEquipe: 1 },
      ]);

      const result = await service.findOne(1);

      expect(result).toHaveProperty("affectations");
    });

    it("should throw NotFoundException when not found", async () => {
      mockEquipeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByDateAndQuart", () => {
    it("should return equipe for date and quart", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1, equipe: "Equipe A" }),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);
      mockAffectationRepository.find.mockResolvedValue([]);

      const result = await service.findByDateAndQuart(1, "2026-01-01", 1);

      expect(result).not.toBeNull();
    });

    it("should return null when no equipe found", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findByDateAndQuart(1, "2026-01-01", 1);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create equipe with affectations", async () => {
      mockEquipeRepository.save.mockResolvedValue({ id: 1 });
      mockAffectationRepository.save.mockResolvedValue([]);

      const result = await service.create({
        equipe: "Equipe A",
        quart: 1,
        idChefQuart: 1,
        date: "2026-01-01",
        affectations: [
          {
            idRondier: 1,
            idZone: 1,
            poste: "Poste A",
            heure_deb: "06:00",
            heure_fin: "14:00",
            heure_tp: "00:00",
            comm_tp: "",
          },
        ],
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
