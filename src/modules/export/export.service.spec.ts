import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Consigne,
  ModeOperatoire,
  QuartEvenement,
  Site,
  ZoneControle,
} from "../../entities";
import { ExportService } from "./export.service";

describe("ExportService", () => {
  let service: ExportService;

  const mockConsigneRepository = { createQueryBuilder: jest.fn() };
  const mockQuartEvenementRepository = { createQueryBuilder: jest.fn() };
  const mockModeOperatoireRepository = { createQueryBuilder: jest.fn() };
  const mockSiteRepository = {
    find: jest.fn(),
    findByIds: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockZoneControleRepository = { find: jest.fn() };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: getRepositoryToken(Consigne),
          useValue: mockConsigneRepository,
        },
        {
          provide: getRepositoryToken(QuartEvenement),
          useValue: mockQuartEvenementRepository,
        },
        {
          provide: getRepositoryToken(ModeOperatoire),
          useValue: mockModeOperatoireRepository,
        },
        { provide: getRepositoryToken(Site), useValue: mockSiteRepository },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneControleRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("exportFiles", () => {
    it("should throw NotFoundException when no sites found", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSiteRepository.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.exportFiles({
          category: "consignes" as any,
          years: [2026],
          months: [1],
          siteIds: [999],
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
