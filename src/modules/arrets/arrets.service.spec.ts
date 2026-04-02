import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Arret } from "../../entities";
import { ArretsService } from "./arrets.service";

describe("ArretsService", () => {
  let service: ArretsService;

  const mockArretRepository = {
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
        ArretsService,
        { provide: getRepositoryToken(Arret), useValue: mockArretRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ArretsService>(ArretsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findTotalsByDateRange", () => {
    it("should return totals grouped by ligne", async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 3_600_000);
      mockArretRepository.find.mockResolvedValue([
        {
          id: 1,
          product: { Name: "Ligne 1 - Incinérateur", idUsine: 1 },
          date_heure_debut: now,
          date_heure_fin: later,
        },
      ]);

      const result = await service.findTotalsByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("ligne");
      expect(result[0]).toHaveProperty("totalArrets");
      expect(result[0]).toHaveProperty("totalHeures");
    });

    it("should return empty array when no arrets", async () => {
      mockArretRepository.find.mockResolvedValue([]);

      const result = await service.findTotalsByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("findAll", () => {
    it("should return grouped arrets without pagination", async () => {
      mockArretRepository.find.mockResolvedValue([
        { id: 1, product: { Name: "Ligne 1 - equipment", idUsine: 1 } },
      ]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockArretRepository.findAndCount.mockResolvedValue([
        [{ id: 1, product: { Name: "Ligne 1", idUsine: 1 } }],
        5,
      ]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByDateRange", () => {
    it("should return arrets in date range", async () => {
      mockArretRepository.find.mockResolvedValue([
        { id: 1, product: { Name: "Equipment", idUsine: 1 } },
      ]);

      const result = await service.findByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("create", () => {
    it("should create an arret and return id", async () => {
      mockArretRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create(
        {
          date_heure_debut: "2024-06-15T08:00:00",
          date_heure_fin: "2024-06-15T10:00:00",
          productId: 1,
        } as any,
        1
      );

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update an existing arret", async () => {
      mockArretRepository.findOne.mockResolvedValue({
        id: 1,
        product: { idUsine: 1 },
      });

      await expect(
        service.update(1, 1, { description: "Updated" } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when not found", async () => {
      mockArretRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, 1, { description: "Updated" } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete an existing arret", async () => {
      mockArretRepository.findOne.mockResolvedValue({
        id: 1,
        product: { idUsine: 1 },
      });
      mockArretRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.delete(1, 1)).resolves.not.toThrow();
    });

    it("should throw NotFoundException when not found", async () => {
      mockArretRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
