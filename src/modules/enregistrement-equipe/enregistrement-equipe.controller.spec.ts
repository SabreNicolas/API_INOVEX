import { Test, TestingModule } from "@nestjs/testing";

import { EnregistrementEquipeController } from "./enregistrement-equipe.controller";
import { EnregistrementEquipeService } from "./enregistrement-equipe.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("EnregistrementEquipeController", () => {
  let controller: EnregistrementEquipeController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
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
      controllers: [EnregistrementEquipeController],
      providers: [
        { provide: EnregistrementEquipeService, useValue: mockService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<EnregistrementEquipeController>(
      EnregistrementEquipeController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll(mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe("create", () => {
    it("should delegate to service", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { equipe: "Team" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith({ equipe: "Team" }, 1);
    });
  });
});
