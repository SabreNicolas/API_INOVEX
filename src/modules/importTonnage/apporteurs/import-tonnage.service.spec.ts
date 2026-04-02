import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnage, MoralEntityNew, ProductNew } from "../../../entities";
import { ImportTonnageService } from "./import-tonnage.service";

describe("ImportTonnageService", () => {
  let service: ImportTonnageService;

  const mockImportTonnageRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };

  const mockMoralEntityRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockProductRepository = {};

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportTonnageService,
        {
          provide: getRepositoryToken(ImportTonnage),
          useValue: mockImportTonnageRepository,
        },
        {
          provide: getRepositoryToken(MoralEntityNew),
          useValue: mockMoralEntityRepository,
        },
        {
          provide: getRepositoryToken(ProductNew),
          useValue: mockProductRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ImportTonnageService>(ImportTonnageService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return entities without pagination", async () => {
      const mockQb = {
        innerJoinAndMapOne: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      mockMoralEntityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(undefined, 1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("create", () => {
    it("should create import tonnage", async () => {
      mockImportTonnageRepository.save.mockResolvedValue({
        id: 1,
        nomImport: "Imp",
      });

      const result = await service.create({
        ProducerId: 1,
        ProductId: 1,
        idUsine: 1,
        nomImport: "Imp",
        productImport: "PI",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
