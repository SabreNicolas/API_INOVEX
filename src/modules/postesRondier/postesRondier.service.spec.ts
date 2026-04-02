import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { PosteRondier } from "../../entities";
import { PostesRondierService } from "./postesRondier.service";

describe("PostesRondierService", () => {
  let service: PostesRondierService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
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
        PostesRondierService,
        { provide: getRepositoryToken(PosteRondier), useValue: mockRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PostesRondierService>(PostesRondierService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all postes", async () => {
      mockRepository.find.mockResolvedValue([{ id: 1, nom: "Poste A" }]);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should create poste", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({ id: 1, nom: "New" });

      const result = await service.create({ nom: "New" } as any);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw BadRequestException for duplicate name", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.create({ nom: "Existing" } as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
