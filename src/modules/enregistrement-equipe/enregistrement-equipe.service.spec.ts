import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  EnregistrementAffectationEquipe,
  EnregistrementEquipe,
} from "../../entities";
import { EnregistrementEquipeService } from "./enregistrement-equipe.service";

describe("EnregistrementEquipeService", () => {
  let service: EnregistrementEquipeService;

  const mockEquipeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
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
        EnregistrementEquipeService,
        {
          provide: getRepositoryToken(EnregistrementEquipe),
          useValue: mockEquipeRepository,
        },
        {
          provide: getRepositoryToken(EnregistrementAffectationEquipe),
          useValue: mockAffectationRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EnregistrementEquipeService>(
      EnregistrementEquipeService
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return empty when no affectations", async () => {
      mockAffectationRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });

    it("should return equipes with affectations", async () => {
      mockAffectationRepository.find.mockResolvedValue([
        { id: 1, idEquipe: 10, rondier: { idUsine: 1 } },
      ]);
      mockEquipeRepository.findByIds.mockResolvedValue([
        { id: 10, equipe: "Team A" },
      ]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return equipe with affectations", async () => {
      mockEquipeRepository.findOne.mockResolvedValue({ id: 1, equipe: "Team" });
      mockAffectationRepository.find.mockResolvedValue([]);

      const result = await service.findOne(1);

      expect(result).toHaveProperty("equipe", "Team");
    });

    it("should throw NotFoundException", async () => {
      mockEquipeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should throw BadRequestException when duplicate name", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1 }),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.create({ equipe: "Team", affectations: [] } as any, 1)
      ).rejects.toThrow(BadRequestException);
    });

    it("should create equipe", async () => {
      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockEquipeRepository.createQueryBuilder.mockReturnValue(mockQb);
      mockEquipeRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create(
        { equipe: "New Team", affectations: [] } as any,
        1
      );

      expect(result).toEqual({ id: 1 });
    });
  });
});
