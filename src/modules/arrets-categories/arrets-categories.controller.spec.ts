import { Test, TestingModule } from "@nestjs/testing";

import { ArretsCategoriesController } from "./arrets-categories.controller";
import { ArretsCategoriesService } from "./arrets-categories.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ArretsCategoriesController", () => {
  let controller: ArretsCategoriesController;

  const mockService = {
    findAllCategories: jest.fn(),
    findOneCategorie: jest.fn(),
    createCategorie: jest.fn(),
    updateCategorie: jest.fn(),
    deleteCategorie: jest.fn(),
    findAllSousCategories: jest.fn(),
    findOneSousCategorie: jest.fn(),
    createSousCategorie: jest.fn(),
    updateSousCategorie: jest.fn(),
    deleteSousCategorie: jest.fn(),
    findAllArretArretCategories: jest.fn(),
    findArretArretCategoriesByNomContient: jest.fn(),
    createArretArretCategorie: jest.fn(),
    deleteArretArretCategorie: jest.fn(),
    findAllCategorieSousCategories: jest.fn(),
    createCategorieSousCategorie: jest.fn(),
    deleteCategorieSousCategorie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArretsCategoriesController],
      providers: [{ provide: ArretsCategoriesService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ArretsCategoriesController>(
      ArretsCategoriesController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllCategories", () => {
    it("should return categories", async () => {
      mockService.findAllCategories.mockResolvedValue([]);

      const result = await controller.findAllCategories();

      expect(result).toEqual([]);
    });
  });

  describe("createCategorie", () => {
    it("should create categorie", async () => {
      mockService.createCategorie.mockResolvedValue({ id: 1, nom: "New" });

      const result = await controller.createCategorie({ nom: "New" } as any);

      expect(result.id).toBe(1);
    });
  });

  describe("updateCategorie", () => {
    it("should update and return message", async () => {
      mockService.updateCategorie.mockResolvedValue(undefined);

      const result = await controller.updateCategorie(1, {
        nom: "Updated",
      } as any);

      expect(result).toEqual({ message: "Catégorie mise à jour avec succès" });
    });
  });

  describe("deleteCategorie", () => {
    it("should delete and return message", async () => {
      mockService.deleteCategorie.mockResolvedValue(undefined);

      const result = await controller.deleteCategorie(1);

      expect(result).toEqual({ message: "Catégorie supprimée avec succès" });
    });
  });

  describe("findAllSousCategories", () => {
    it("should return sous-categories", async () => {
      mockService.findAllSousCategories.mockResolvedValue([]);

      const result = await controller.findAllSousCategories();

      expect(result).toEqual([]);
    });
  });

  describe("findAllArretArretCategories", () => {
    it("should return liaisons", async () => {
      mockService.findAllArretArretCategories.mockResolvedValue([]);

      const result = await controller.findAllArretArretCategories();

      expect(result).toEqual([]);
    });
  });
});
