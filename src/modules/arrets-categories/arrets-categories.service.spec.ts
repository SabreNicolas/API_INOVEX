import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  ArretArretCategorie,
  ArretCategorie,
  ArretCategorieSousCategorie,
  ArretSousCategorie,
} from "@/entities";

import { ArretsCategoriesService } from "./arrets-categories.service";

describe("ArretsCategoriesService", () => {
  let service: ArretsCategoriesService;

  const mockCategorieRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSousCategorieRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockArretArretCategorieRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockCategorieSousCategorieRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
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
        ArretsCategoriesService,
        {
          provide: getRepositoryToken(ArretCategorie),
          useValue: mockCategorieRepo,
        },
        {
          provide: getRepositoryToken(ArretSousCategorie),
          useValue: mockSousCategorieRepo,
        },
        {
          provide: getRepositoryToken(ArretArretCategorie),
          useValue: mockArretArretCategorieRepo,
        },
        {
          provide: getRepositoryToken(ArretCategorieSousCategorie),
          useValue: mockCategorieSousCategorieRepo,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ArretsCategoriesService>(ArretsCategoriesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ========== Catégories ==========

  describe("findAllCategories", () => {
    it("should return categories", async () => {
      mockCategorieRepo.find.mockResolvedValue([{ id: 1, nom: "Cat A" }]);

      const result = await service.findAllCategories();

      expect(result).toHaveLength(1);
    });
  });

  describe("findOneCategorie", () => {
    it("should return categorie", async () => {
      mockCategorieRepo.findOne.mockResolvedValue({ id: 1, nom: "Cat A" });

      const result = await service.findOneCategorie(1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockCategorieRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneCategorie(999)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("createCategorie", () => {
    it("should create and return categorie", async () => {
      mockCategorieRepo.save.mockResolvedValue({ id: 1, nom: "New" });

      const result = await service.createCategorie({ nom: "New" } as any);

      expect(result.id).toBe(1);
    });
  });

  describe("updateCategorie", () => {
    it("should update categorie", async () => {
      mockCategorieRepo.findOne.mockResolvedValue({ id: 1 });

      await service.updateCategorie(1, { nom: "Updated" } as any);

      expect(mockCategorieRepo.update).toHaveBeenCalledWith(1, {
        nom: "Updated",
      });
    });

    it("should throw NotFoundException", async () => {
      mockCategorieRepo.findOne.mockResolvedValue(null);

      await expect(service.updateCategorie(999, {} as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("deleteCategorie", () => {
    it("should delete categorie", async () => {
      mockCategorieRepo.findOne.mockResolvedValue({ id: 1 });

      await service.deleteCategorie(1);

      expect(mockCategorieRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  // ========== Sous-Catégories ==========

  describe("findAllSousCategories", () => {
    it("should return sous-categories", async () => {
      mockSousCategorieRepo.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAllSousCategories();

      expect(result).toHaveLength(1);
    });
  });

  describe("createSousCategorie", () => {
    it("should create sous-categorie", async () => {
      mockSousCategorieRepo.save.mockResolvedValue({ id: 1, nom: "SC" });

      const result = await service.createSousCategorie({ nom: "SC" } as any);

      expect(result.id).toBe(1);
    });
  });

  // ========== Liaisons ==========

  describe("findAllArretArretCategories", () => {
    it("should return liaisons", async () => {
      mockArretArretCategorieRepo.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAllArretArretCategories();

      expect(result).toHaveLength(1);
    });
  });
});
