import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Badge, User, ZoneControle } from "../../entities";
import { BadgeService } from "./badge.service";

describe("BadgeService", () => {
  let service: BadgeService;

  const mockBadgeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockZoneRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockQueryBuilder = (data: any[] = [], total = 0) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(data),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        { provide: getRepositoryToken(Badge), useValue: mockBadgeRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(ZoneControle),
          useValue: mockZoneRepository,
        },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByUser", () => {
    it("should return badges for a user without pagination", async () => {
      const badges = [{ id: 1, uid: "ABC", userId: 1, idUsine: 1 }];
      mockBadgeRepository.find.mockResolvedValue(badges);

      const result = await service.findByUser(1, 1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("should return paginated badges", async () => {
      mockBadgeRepository.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

      const result = await service.findByUser(1, 1, { page: 1, limit: 10 });

      expect(result).toHaveProperty("meta");
    });
  });

  describe("findByZone", () => {
    it("should return badges for a zone", async () => {
      const badges = [{ id: 1, uid: "DEF", zoneId: 1 }];
      mockBadgeRepository.find.mockResolvedValue(badges);

      const result = await service.findByZone(1, 1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findAllAssignedToUsers", () => {
    it("should return badges assigned to users without pagination", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockBadgeRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllAssignedToUsers(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paginated result", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }], 5);
      mockBadgeRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllAssignedToUsers(1, {
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty("meta");
      expect((result as any).meta.total).toBe(5);
    });
  });

  describe("findAllAssignedToZones", () => {
    it("should return badges assigned to zones", async () => {
      const qb = createMockQueryBuilder([{ id: 1 }]);
      mockBadgeRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllAssignedToZones(1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findUnassigned", () => {
    it("should return unassigned badges", async () => {
      mockBadgeRepository.find.mockResolvedValue([{ id: 1, uid: "UNA" }]);

      const result = await service.findUnassigned(1);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("create", () => {
    it("should create a new badge", async () => {
      mockBadgeRepository.findOne.mockResolvedValue(null); // No duplicate
      mockBadgeRepository.save.mockResolvedValue({ id: 1, uid: "NEW" });

      const result = await service.create({ uid: "NEW", idUsine: 1 } as any);

      expect(result).toHaveProperty("id");
    });
  });

  describe("assignToUser", () => {
    it("should assign badge to user", async () => {
      mockBadgeRepository.findOne.mockResolvedValue({
        id: 1,
        uid: "ABC",
        zoneId: null,
      });
      mockUserRepository.findOne.mockResolvedValue({ id: 5 });

      await expect(
        service.assignToUser(1, { userId: 5 } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when badge not found", async () => {
      mockBadgeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignToUser(999, { userId: 5 } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("assignToZone", () => {
    it("should assign badge to zone", async () => {
      mockBadgeRepository.findOne.mockResolvedValue({
        id: 1,
        uid: "ABC",
        userId: null,
      });
      mockZoneRepository.findOne.mockResolvedValue({ id: 3 });

      await expect(
        service.assignToZone(1, { zoneId: 3 } as any)
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException when badge not found", async () => {
      mockBadgeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignToZone(999, { zoneId: 3 } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
