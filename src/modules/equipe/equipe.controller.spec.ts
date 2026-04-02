import { Test, TestingModule } from "@nestjs/testing";

import { EquipeController } from "./equipe.controller";
import { EquipeService } from "./equipe.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("EquipeController", () => {
  let controller: EquipeController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDateAndQuart: jest.fn(),
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
      controllers: [EquipeController],
      providers: [{ provide: EquipeService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<EquipeController>(EquipeController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findByDateAndQuart", () => {
    it("should delegate to service with user idUsine", async () => {
      const equipe = { id: 1, equipe: "Equipe A" };
      mockService.findByDateAndQuart.mockResolvedValue(equipe);

      const result = await controller.findByDateAndQuart(
        { date: "2026-01-01", quart: 1 } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual(equipe);
      expect(mockService.findByDateAndQuart).toHaveBeenCalledWith(
        1,
        "2026-01-01",
        1
      );
    });
  });

  describe("create", () => {
    it("should create equipe", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create({
        equipe: "Equipe A",
        quart: 1,
        idChefQuart: 1,
      } as any);

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(
        1,
        { equipe: "Updated" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ message: "Équipe mise à jour avec succès" });
    });
  });
});
