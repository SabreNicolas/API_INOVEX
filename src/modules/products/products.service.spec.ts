import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  CategorieNew,
  ImportTonnage,
  ImportTonnageReactif,
  ImportTonnageSortant,
  MeasureNew,
  MoralEntityNew,
  ProductCategorieNew,
  ProductNew,
  Site,
  TypeNew,
} from "../../entities";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;

  const mockProductsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTypeRepository = { find: jest.fn() };
  const mockMeasureRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };
  const mockMoralEntityRepository = {};
  const mockImportTonnageRepository = {};
  const mockImportTonnageSortantRepository = {};
  const mockImportTonnageReactifRepository = {};
  const mockCategorieRepository = {};
  const mockProductCategorieRepository = {};
  const mockSiteRepository = {};

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(ProductNew),
          useValue: mockProductsRepository,
        },
        { provide: getRepositoryToken(TypeNew), useValue: mockTypeRepository },
        {
          provide: getRepositoryToken(MeasureNew),
          useValue: mockMeasureRepository,
        },
        {
          provide: getRepositoryToken(MoralEntityNew),
          useValue: mockMoralEntityRepository,
        },
        {
          provide: getRepositoryToken(ImportTonnage),
          useValue: mockImportTonnageRepository,
        },
        {
          provide: getRepositoryToken(ImportTonnageSortant),
          useValue: mockImportTonnageSortantRepository,
        },
        {
          provide: getRepositoryToken(ImportTonnageReactif),
          useValue: mockImportTonnageReactifRepository,
        },
        {
          provide: getRepositoryToken(CategorieNew),
          useValue: mockCategorieRepository,
        },
        {
          provide: getRepositoryToken(ProductCategorieNew),
          useValue: mockProductCategorieRepository,
        },
        { provide: getRepositoryToken(Site), useValue: mockSiteRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findArrets", () => {
    it("should return arret products", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, Name: "Product" }]),
      };
      mockProductsRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findArrets(1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findAll", () => {
    it("should return all products without pagination", async () => {
      mockProductsRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAll(undefined, 1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockProductsRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll({ page: 1, limit: 10 }, 1);

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findAllTypes", () => {
    it("should return types", async () => {
      mockTypeRepository.find.mockResolvedValue([{ id: 1, type: "Type A" }]);

      const result = await service.findAllTypes();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return product", async () => {
      mockProductsRepository.findOne.mockResolvedValue({
        id: 1,
        Name: "Product",
      });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockProductsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create product", async () => {
      mockProductsRepository.save.mockResolvedValue({ id: 1, Name: "New" });

      const result = await service.create({ Name: "New" } as any);

      expect(result.id).toBe(1);
    });
  });
});
