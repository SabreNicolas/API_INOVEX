import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "../../common/services/logger.service";
import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("BadgeController", () => {
  let controller: BadgeController;

  const mockBadgeService = {
    findAllAssignedToUsers: jest.fn(),
    findAllAssignedToZones: jest.fn(),
    findUnassigned: jest.fn(),
    create: jest.fn(),
    assignToUser: jest.fn(),
    assignToZone: jest.fn(),
    findZonesWithoutBadge: jest.fn(),
    findUsersWithoutBadge: jest.fn(),
    unassign: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    login: "admin",
    nom: "Doe",
    prenom: "John",
    isRondier: false,
    isSaisie: false,
    isQSE: false,
    isRapport: false,
    isAdmin: true,
    isChefQuart: false,
    isSuperAdmin: false,
    isKerlan: false,
    idUsine: 1,
    roles: [5],
    roleName: "Admin" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeController],
      providers: [
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<BadgeController>(BadgeController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllAssignedToUsers", () => {
    it("should return badges assigned to users", async () => {
      const badges = [{ id: 1, uid: "ABC123", userId: 1 }];
      mockBadgeService.findAllAssignedToUsers.mockResolvedValue(badges);

      const result = await controller.findAllAssignedToUsers(
        {},
        mockCurrentUser as any
      );

      expect(result).toEqual(badges);
      expect(mockBadgeService.findAllAssignedToUsers).toHaveBeenCalledWith(
        1,
        {}
      );
    });
  });

  describe("findAllAssignedToZones", () => {
    it("should return badges assigned to zones", async () => {
      const badges = [{ id: 1, uid: "DEF456", zoneId: 1 }];
      mockBadgeService.findAllAssignedToZones.mockResolvedValue(badges);

      const result = await controller.findAllAssignedToZones(
        {},
        mockCurrentUser as any
      );

      expect(result).toEqual(badges);
    });
  });

  describe("findUnassigned", () => {
    it("should return unassigned badges", async () => {
      const badges = [{ id: 2, uid: "GHI789" }];
      mockBadgeService.findUnassigned.mockResolvedValue(badges);

      const result = await controller.findUnassigned(
        {},
        mockCurrentUser as any
      );

      expect(result).toEqual(badges);
    });
  });

  describe("create", () => {
    it("should create a badge", async () => {
      mockBadgeService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({
        uid: "NEW123",
        idUsine: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("assignToUser", () => {
    it("should assign badge to user and return message", async () => {
      mockBadgeService.assignToUser.mockResolvedValue(undefined);

      const result = await controller.assignToUser(1, { userId: 5 } as any);

      expect(result).toEqual({
        message: "Badge affecté à l'utilisateur avec succès",
      });
    });
  });

  describe("assignToZone", () => {
    it("should assign badge to zone and return message", async () => {
      mockBadgeService.assignToZone.mockResolvedValue(undefined);

      const result = await controller.assignToZone(1, { zoneId: 3 } as any);

      expect(result).toEqual({
        message: "Badge affecté à la zone avec succès",
      });
    });
  });
});
