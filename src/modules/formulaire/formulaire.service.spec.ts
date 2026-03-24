import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Formulaire,
  FormulaireAffectation,
  MeasureNew,
  ProductNew,
} from "../../entities";
import { FormulaireService } from "./formulaire.service";

describe("FormulaireService", () => {
  let service: FormulaireService;

  const mockFormulaire = {
    idFormulaire: 1,
    nom: "Formulaire Test",
    idUsine: 1,
  };

  const mockAffectation = {
    id: 1,
    idFormulaire: 1,
    idProduct: 10,
    alias: "Alias 1",
  };

  const mockProduct = {
    Id: 10,
    Name: "Product Test",
    Enabled: true,
    elementRondier: null,
  };

  const mockFormulaireRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockAffectationRepository = {
    find: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMeasureNewRepository = {};

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormulaireService,
        {
          provide: getRepositoryToken(Formulaire),
          useValue: mockFormulaireRepository,
        },
        {
          provide: getRepositoryToken(FormulaireAffectation),
          useValue: mockAffectationRepository,
        },
        {
          provide: getRepositoryToken(ProductNew),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(MeasureNew),
          useValue: mockMeasureNewRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FormulaireService>(FormulaireService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    it("should throw NotFoundException if formulaire not found", async () => {
      mockFormulaireRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("should return formulaire with products (batch query)", async () => {
      mockFormulaireRepository.findOne.mockResolvedValue(mockFormulaire);
      mockAffectationRepository.find.mockResolvedValue([mockAffectation]);

      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      mockProductsRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findOne(1);

      expect(result.idFormulaire).toBe(1);
      expect(result.produits).toHaveLength(1);
      expect(result.produits[0].product).toEqual(mockProduct);
      // Vérifie que c'est bien un batch (createQueryBuilder) et non findOne individuel
      expect(mockProductsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockProductsRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all formulaires without pagination", async () => {
      mockFormulaireRepository.find.mockResolvedValue([mockFormulaire]);

      const result = await service.findAll(undefined, 1);

      expect(result).toEqual([mockFormulaire]);
    });

    it("should return paginated formulaires", async () => {
      mockFormulaireRepository.findAndCount.mockResolvedValue([
        [mockFormulaire],
        1,
      ]);

      const result = await service.findAll({ page: 1, limit: 20 }, 1);

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total", 1);
    });
  });

  describe("findAllWithProducts", () => {
    it("should batch-load affectations and products", async () => {
      mockFormulaireRepository.find.mockResolvedValue([mockFormulaire]);

      const mockAffQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAffectation]),
      };
      mockAffectationRepository.createQueryBuilder.mockReturnValue(mockAffQb);

      const mockProdQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      mockProductsRepository.createQueryBuilder.mockReturnValue(mockProdQb);

      const result = await service.findAllWithProducts(undefined, 1);

      expect(Array.isArray(result)).toBe(true);
      const arr = result as any[];
      expect(arr).toHaveLength(1);
      expect(arr[0].produits).toHaveLength(1);
      // Batch queries used instead of N+1
      expect(mockAffectationRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create formulaire with products", async () => {
      const savedFormulaire = { ...mockFormulaire, idFormulaire: 2 };
      mockFormulaireRepository.create.mockReturnValue(savedFormulaire);
      mockFormulaireRepository.save.mockResolvedValue(savedFormulaire);
      mockAffectationRepository.create.mockReturnValue(mockAffectation);
      mockAffectationRepository.save.mockResolvedValue(mockAffectation);

      const mockProdQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      mockProductsRepository.createQueryBuilder.mockReturnValue(mockProdQb);

      const result = await service.create(
        { nom: "Test", produits: [{ idProduct: 10, alias: "Alias" }] },
        1
      );

      expect(result).toHaveProperty("idFormulaire", 2);
      expect(result.produits).toHaveLength(1);
    });
  });

  describe("delete", () => {
    it("should throw NotFoundException if formulaire not found", async () => {
      mockFormulaireRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it("should delete formulaire and affectations", async () => {
      mockFormulaireRepository.findOne.mockResolvedValue(mockFormulaire);
      mockAffectationRepository.delete.mockResolvedValue({});
      mockFormulaireRepository.delete.mockResolvedValue({});

      await service.delete(1);

      expect(mockAffectationRepository.delete).toHaveBeenCalledWith({
        idFormulaire: 1,
      });
      expect(mockFormulaireRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
