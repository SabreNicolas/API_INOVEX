import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ValidationDonnee } from "../../entities";
import { ValidationDonneesService } from "./validation-donnees.service";

describe("ValidationDonneesService", () => {
  let service: ValidationDonneesService;

  const mockRepository = {
    find: jest.fn(),
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
        ValidationDonneesService,
        {
          provide: getRepositoryToken(ValidationDonnee),
          useValue: mockRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ValidationDonneesService>(ValidationDonneesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByAnneeAndMois", () => {
    it("should return validations", async () => {
      mockRepository.find.mockResolvedValue([
        { id: 1, anneeValidation: "2026", moisValidation: "03" },
      ]);

      const result = await service.findByAnneeAndMois(1, "2026", "03");

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { idUsine: 1, anneeValidation: "2026", moisValidation: "03" },
        order: { date: "DESC" },
      });
    });
  });

  describe("create", () => {
    it("should create validation", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({
        id: 1,
        moisValidation: "03",
        anneeValidation: "2026",
      });

      const result = await service.create(
        { moisValidation: "03", anneeValidation: "2026" } as any,
        1,
        1
      );

      expect(result.id).toBe(1);
    });

    it("should throw ConflictException when duplicate", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.create(
          { moisValidation: "03", anneeValidation: "2026" } as any,
          1,
          1
        )
      ).rejects.toThrow(ConflictException);
    });
  });
});
