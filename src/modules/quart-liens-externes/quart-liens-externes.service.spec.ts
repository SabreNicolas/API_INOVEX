import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartLienExterne } from "../../entities";
import { QuartLiensExternesService } from "./quart-liens-externes.service";

describe("QuartLiensExternesService", () => {
  let service: QuartLiensExternesService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
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
        QuartLiensExternesService,
        {
          provide: getRepositoryToken(QuartLienExterne),
          useValue: mockRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<QuartLiensExternesService>(QuartLiensExternesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return links for usine", async () => {
      mockRepository.find.mockResolvedValue([{ id: 1, nom: "Link" }]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { idUsine: 1 },
        order: { nom: "ASC" },
      });
    });
  });

  describe("findOne", () => {
    it("should return link", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nom: "Link" });

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create and return id", async () => {
      mockRepository.save.mockResolvedValue({ id: 1, nom: "New Link" });

      const result = await service.create(1, {
        nom: "New Link",
        url: "https://example.com",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update link", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      await service.update(1, 1, { nom: "Updated" } as any);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { nom: "Updated" });
    });

    it("should throw NotFoundException", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, {} as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("delete", () => {
    it("should delete link", async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      await service.delete(1, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
