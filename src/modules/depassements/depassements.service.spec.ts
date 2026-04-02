import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ChoixDepassement,
  ChoixDepassementProduit,
  DepassementNew,
  DepassementProduit,
} from "../../entities";
import { DepassementsService } from "./depassements.service";

describe("DepassementsService", () => {
  let service: DepassementsService;

  const mockDepassementRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockChoixDepassementRepository = {
    find: jest.fn(),
  };

  const mockChoixDepassementProduitRepository = {
    find: jest.fn(),
  };

  const mockDepassementProduitRepository = {
    find: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
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
        DepassementsService,
        {
          provide: getRepositoryToken(DepassementNew),
          useValue: mockDepassementRepository,
        },
        {
          provide: getRepositoryToken(ChoixDepassement),
          useValue: mockChoixDepassementRepository,
        },
        {
          provide: getRepositoryToken(ChoixDepassementProduit),
          useValue: mockChoixDepassementProduitRepository,
        },
        {
          provide: getRepositoryToken(DepassementProduit),
          useValue: mockDepassementProduitRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DepassementsService>(DepassementsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findChoixWithProduits", () => {
    it("should return choix with their associated produits", async () => {
      mockChoixDepassementRepository.find.mockResolvedValue([
        { id: 1, nom: "Choix A" },
        { id: 2, nom: "Choix B" },
      ]);
      mockDepassementProduitRepository.find.mockResolvedValue([
        { idChoixDepassements: 1, idChoixDepassementsProduits: 10 },
      ]);
      mockChoixDepassementProduitRepository.find.mockResolvedValue([
        { id: 10, nom: "Produit X" },
      ]);

      const result = await service.findChoixWithProduits();

      expect(result).toHaveLength(2);
      expect(result[0].produits).toHaveLength(1);
      expect(result[1].produits).toHaveLength(0);
    });
  });

  describe("findTotalsByDateRange", () => {
    it("should return totals grouped by ligne", async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 3_600_000);
      mockDepassementRepository.find.mockResolvedValue([
        {
          id: 1,
          ligne: "ligne 1",
          choixDepassements: "Type A",
          date_heure_debut: now,
          date_heure_fin: later,
          idUsine: 1,
        },
      ]);

      const result = await service.findTotalsByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(result).toHaveLength(1);
      expect(result[0].ligne).toBe("ligne 1");
      expect(result[0].totalDepassements).toBe(1);
    });

    it("should return empty array when no depassements", async () => {
      mockDepassementRepository.find.mockResolvedValue([]);

      const result = await service.findTotalsByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("findByDateRange", () => {
    it("should return grouped depassements without pagination", async () => {
      mockDepassementRepository.find.mockResolvedValue([
        { id: 1, ligne: "ligne 1", idUsine: 1 },
      ]);

      const result = await service.findByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31")
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      mockDepassementRepository.findAndCount.mockResolvedValue([
        [{ id: 1, ligne: "ligne 1" }],
        5,
      ]);

      const result = await service.findByDateRange(
        1,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
        { page: 1, limit: 10 }
      );

      expect(result).toHaveProperty("meta");
    });
  });

  describe("create", () => {
    it("should create a depassement and return id", async () => {
      mockDepassementRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.create(
        {
          choixDepassements: "Type A",
          ligne: "ligne 1",
          date_heure_debut: "2024-06-15T08:00:00",
          date_heure_fin: "2024-06-15T10:00:00",
        } as any,
        1
      );

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("findAllChoixDepassement", () => {
    it("should return all choix depassement", async () => {
      mockChoixDepassementRepository.find.mockResolvedValue([
        { id: 1, nom: "Choix" },
      ]);

      const result = await service.findAllChoixDepassement();

      expect(result).toHaveLength(1);
    });
  });

  describe("findAllChoixDepassementProduit", () => {
    it("should return all choix depassement produits", async () => {
      mockChoixDepassementProduitRepository.find.mockResolvedValue([
        { id: 1, nom: "Produit" },
      ]);

      const result = await service.findAllChoixDepassementProduit();

      expect(result).toHaveLength(1);
    });
  });

  describe("findAllDepassementProduit", () => {
    it("should return all depassement produits", async () => {
      mockDepassementProduitRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAllDepassementProduit();

      expect(result).toHaveLength(1);
    });
  });
});
