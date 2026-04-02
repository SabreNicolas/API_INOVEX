import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ConsigneType,
  Conversion,
  PosteRondier,
  QuartEvenementCause,
  Rapport,
  Site,
} from "../../entities";
import { AdminKerlanService } from "./admin-kerlan.service";

describe("AdminKerlanService", () => {
  let service: AdminKerlanService;

  const mockSiteRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };

  const mockConsigneTypeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockQuartEvenementCauseRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockRapportRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockPosteRondierRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockConversionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
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
        AdminKerlanService,
        { provide: getRepositoryToken(Site), useValue: mockSiteRepository },
        {
          provide: getRepositoryToken(ConsigneType),
          useValue: mockConsigneTypeRepository,
        },
        {
          provide: getRepositoryToken(QuartEvenementCause),
          useValue: mockQuartEvenementCauseRepository,
        },
        {
          provide: getRepositoryToken(Rapport),
          useValue: mockRapportRepository,
        },
        {
          provide: getRepositoryToken(PosteRondier),
          useValue: mockPosteRondierRepository,
        },
        {
          provide: getRepositoryToken(Conversion),
          useValue: mockConversionRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AdminKerlanService>(AdminKerlanService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ==================== SITES ====================

  describe("findAllSites", () => {
    it("should return all sites without pagination", async () => {
      const sites = [{ id: 1, localisation: "COUVIN" }];
      mockSiteRepository.find.mockResolvedValue(sites);

      const result = await service.findAllSites();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("should return paginated sites", async () => {
      mockSiteRepository.findAndCount.mockResolvedValue([
        [{ id: 1, localisation: "COUVIN" }],
        5,
      ]);

      const result = await service.findAllSites({ page: 1, limit: 10 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(5);
    });
  });

  describe("findOneSite", () => {
    it("should return a site by id", async () => {
      mockSiteRepository.findOne.mockResolvedValue({
        id: 1,
        localisation: "COUVIN",
      });

      const result = await service.findOneSite(1);

      expect(result.localisation).toBe("COUVIN");
    });

    it("should throw NotFoundException when site not found", async () => {
      mockSiteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneSite(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("createSite", () => {
    it("should create a site and return its id", async () => {
      mockSiteRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createSite({
        localisation: "COUVIN",
        codeUsine: "CVN",
      } as any);

      expect(result).toEqual({ id: 1 });
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe("updateSite", () => {
    it("should update an existing site", async () => {
      mockSiteRepository.findOne.mockResolvedValue({
        id: 1,
        localisation: "OLD",
      });
      mockSiteRepository.save.mockResolvedValue({ id: 1, localisation: "NEW" });

      await expect(
        service.updateSite(1, { localisation: "NEW" } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when site not found", async () => {
      mockSiteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSite(999, { localisation: "NEW" } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== CONSIGNE TYPES ====================

  describe("findAllConsigneTypes", () => {
    it("should return consigne types without pagination", async () => {
      mockConsigneTypeRepository.find.mockResolvedValue([
        { id: 1, libelle: "Sécurité" },
      ]);

      const result = await service.findAllConsigneTypes();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated consigne types", async () => {
      mockConsigneTypeRepository.findAndCount.mockResolvedValue([
        [{ id: 1, libelle: "Sécurité" }],
        1,
      ]);

      const result = await service.findAllConsigneTypes({ page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findOneConsigneType", () => {
    it("should return a consigne type by id", async () => {
      mockConsigneTypeRepository.findOne.mockResolvedValue({
        id: 1,
        libelle: "Sécurité",
      });

      const result = await service.findOneConsigneType(1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockConsigneTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneConsigneType(999)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("createConsigneType", () => {
    it("should create and return id", async () => {
      mockConsigneTypeRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createConsigneType({
        libelle: "Sécurité",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("updateConsigneType", () => {
    it("should update an existing type", async () => {
      mockConsigneTypeRepository.findOne.mockResolvedValue({ id: 1 });
      mockConsigneTypeRepository.save.mockResolvedValue({ id: 1 });

      await expect(
        service.updateConsigneType(1, { libelle: "Updated" } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when not found", async () => {
      mockConsigneTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.updateConsigneType(999, {} as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("deleteConsigneType", () => {
    it("should delete an existing type", async () => {
      mockConsigneTypeRepository.findOne.mockResolvedValue({ id: 1 });
      mockConsigneTypeRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteConsigneType(1)).resolves.not.toThrow();
    });
  });

  // ==================== QUART EVENEMENT CAUSES ====================

  describe("findAllQuartEvenementCauses", () => {
    it("should return causes without pagination", async () => {
      mockQuartEvenementCauseRepository.find.mockResolvedValue([
        { id: 1, libelle: "Panne" },
      ]);

      const result = await service.findAllQuartEvenementCauses();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOneQuartEvenementCause", () => {
    it("should throw NotFoundException when not found", async () => {
      mockQuartEvenementCauseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneQuartEvenementCause(999)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ==================== RAPPORTS ====================

  describe("findAllRapports", () => {
    it("should return rapports without pagination", async () => {
      mockRapportRepository.find.mockResolvedValue([{ id: 1, nom: "Rapport" }]);

      const result = await service.findAllRapports();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==================== POSTES RONDIER ====================

  describe("findAllPostesRondier", () => {
    it("should return postes without pagination", async () => {
      mockPosteRondierRepository.find.mockResolvedValue([
        { id: 1, libelle: "Poste A" },
      ]);

      const result = await service.findAllPostesRondier();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==================== CONVERSIONS ====================

  describe("findAllConversions", () => {
    it("should return conversions without pagination", async () => {
      mockConversionRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAllConversions();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
