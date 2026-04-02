import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import { MoralEntityNew, ProductNew } from "@/entities";

import { MoralEntitiesService } from "./moral-entities.service";

describe("MoralEntitiesService", () => {
  let service: MoralEntitiesService;

  const mockMoralEntityRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
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
        MoralEntitiesService,
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

    service = module.get<MoralEntitiesService>(MoralEntitiesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all entities without pagination", async () => {
      const mockQb = {
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, Name: "Entity" }]),
      };
      mockMoralEntityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      const mockQb = {
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };
      mockMoralEntityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findOne", () => {
    it("should return entity", async () => {
      const mockQb = {
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1, Name: "Entity" }),
      };
      mockMoralEntityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      const mockQb = {
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockMoralEntityRepository.createQueryBuilder.mockReturnValue(mockQb);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create entity and return id", async () => {
      mockMoralEntityRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create({ Name: "New" } as any, 1);

      expect(result).toEqual({ id: 1 });
    });
  });
});
