import { Test, TestingModule } from "@nestjs/testing";

import { QuartActionsController } from "./quart-actions.controller";
import { QuartActionsService } from "./quart-actions.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("QuartActionsController", () => {
  let controller: QuartActionsController;

  const mockService = {
    findAllEnregistrements: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    createEnregistrement: jest.fn(),
    updateEnregistrement: jest.fn(),
    deleteEnregistrement: jest.fn(),
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
      controllers: [QuartActionsController],
      providers: [{ provide: QuartActionsService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<QuartActionsController>(QuartActionsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllEnregistrements", () => {
    it("should delegate to service", async () => {
      mockService.findAllEnregistrements.mockResolvedValue([]);

      await controller.findAllEnregistrements(mockCurrentUser as any);

      expect(mockService.findAllEnregistrements).toHaveBeenCalledWith(1);
    });
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("create", () => {
    it("should create action", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { nom: "Action" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("createEnregistrement", () => {
    it("should create enregistrement", async () => {
      mockService.createEnregistrement.mockResolvedValue({ id: 1 });

      const result = await controller.createEnregistrement(
        { nom: "Enregistrement" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
    });
  });
});
