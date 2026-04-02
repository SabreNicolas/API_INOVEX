import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Anomalie } from "../../entities";
import { AnomalieService } from "./anomalie.service";

describe("AnomalieService", () => {
  let service: AnomalieService;

  const mockAnomalieRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
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
        AnomalieService,
        {
          provide: getRepositoryToken(Anomalie),
          useValue: mockAnomalieRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AnomalieService>(AnomalieService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return anomalies without pagination", async () => {
      const anomalies = [{ id: 1, commentaire: "Test" }];
      mockAnomalieRepository.find.mockResolvedValue(anomalies);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("should return paginated result", async () => {
      mockAnomalieRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 5]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(5);
    });
  });

  describe("findOne", () => {
    it("should return an anomalie by id", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue({
        id: 1,
        commentaire: "Test",
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it("should throw NotFoundException when not found", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create and return id", async () => {
      mockAnomalieRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create({
        rondeId: 1,
        zoneId: 1,
        commentaire: "Test anomalie",
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update an existing anomalie", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.update(1, { commentaire: "Updated" } as any)
      ).resolves.not.toThrow();
      expect(mockAnomalieRepository.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when not found", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { commentaire: "Updated" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should not call update when no fields to update", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue({ id: 1 });

      await service.update(1, {} as any);

      expect(mockAnomalieRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete an existing anomalie", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue({ id: 1 });
      mockAnomalieRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.delete(1)).resolves.not.toThrow();
    });

    it("should throw NotFoundException when not found", async () => {
      mockAnomalieRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
