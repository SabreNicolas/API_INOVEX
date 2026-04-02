import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { ModeOperatoire, ZoneControle } from "../../entities";
import { ModeOperatoireService } from "./mode-operatoire.service";

describe("ModeOperatoireService", () => {
  let service: ModeOperatoireService;

  const mockModeOperatoireRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockZoneControleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFileUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
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
        ModeOperatoireService,
        {
          provide: getRepositoryToken(ModeOperatoire),
          useValue: mockModeOperatoireRepository,
        },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneControleRepository,
        },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ModeOperatoireService>(ModeOperatoireService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return empty when no zones", async () => {
      mockZoneControleRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });

    it("should return modes with zone info", async () => {
      mockZoneControleRepository.find.mockResolvedValue([
        { id: 1, idUsine: 1, nom: "Zone A" },
      ]);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 1, nom: "Mode 1", zoneId: 1 }]),
      };
      mockModeOperatoireRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("should return paginated result", async () => {
      mockZoneControleRepository.find.mockResolvedValue([
        { id: 1, idUsine: 1 },
      ]);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[{ id: 1, zoneId: 1 }], 1]),
      };
      mockModeOperatoireRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByZone", () => {
    it("should return modes for a zone", async () => {
      mockZoneControleRepository.findOne.mockResolvedValue({ id: 1 });
      mockModeOperatoireRepository.find.mockResolvedValue([
        { id: 1, zoneId: 1 },
      ]);

      const result = await service.findByZone(1);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
