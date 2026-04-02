import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageParametreSens } from "../../../entities";
import { ImportTonnageParametreSensService } from "./import-tonnage-parametre-sens.service";

describe("ImportTonnageParametreSensService", () => {
  let service: ImportTonnageParametreSensService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
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
        ImportTonnageParametreSensService,
        {
          provide: getRepositoryToken(ImportTonnageParametreSens),
          useValue: mockRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ImportTonnageParametreSensService>(
      ImportTonnageParametreSensService
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all without pagination", async () => {
      mockRepository.find.mockResolvedValue([{ id: 1, sens: "E" }]);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("create", () => {
    it("should create parametre sens", async () => {
      mockRepository.save.mockResolvedValue({ id: 1, sens: "E" });

      const result = await service.create({
        sens: "E",
        correspondanceFichier: "entree",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });
});
