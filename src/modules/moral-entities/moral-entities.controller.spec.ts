import { Test, TestingModule } from "@nestjs/testing";

import { MoralEntitiesController } from "./moral-entities.controller";
import { MoralEntitiesService } from "./moral-entities.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("MoralEntitiesController", () => {
  let controller: MoralEntitiesController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
      controllers: [MoralEntitiesController],
      providers: [{ provide: MoralEntitiesService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<MoralEntitiesController>(MoralEntitiesController);
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

  describe("create", () => {
    it("should delegate to service with idUsine", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { Name: "New" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith({ Name: "New" }, 1);
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(
        1,
        { Name: "Updated" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({
        message: "Entité morale mise à jour avec succès",
      });
    });
  });
});
