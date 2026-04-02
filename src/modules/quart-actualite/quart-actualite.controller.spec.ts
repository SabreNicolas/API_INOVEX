import { Test, TestingModule } from "@nestjs/testing";

import { QuartActualiteController } from "./quart-actualite.controller";
import { QuartActualiteService } from "./quart-actualite.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("QuartActualiteController", () => {
  let controller: QuartActualiteController;

  const mockService = {
    findAll: jest.fn(),
    findActiveOnDate: jest.fn(),
    findByDateRange: jest.fn(),
    findInactive: jest.fn(),
    findFuture: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    login: "admin",
    nom: "Doe",
    prenom: "John",
    isAdmin: true,
    idUsine: 1,
    roles: [5],
    roleName: "Admin" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuartActualiteController],
      providers: [{ provide: QuartActualiteService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<QuartActualiteController>(QuartActualiteController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findActiveOnDate", () => {
    it("should delegate to service with parsed date", async () => {
      mockService.findActiveOnDate.mockResolvedValue([]);

      await controller.findActiveOnDate(
        { date: "2026-01-01", page: 1, limit: 10 } as any,
        mockCurrentUser as any
      );

      expect(mockService.findActiveOnDate).toHaveBeenCalled();
    });
  });
});
