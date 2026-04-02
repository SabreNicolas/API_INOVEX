import { Test, TestingModule } from "@nestjs/testing";

import { QuartLiensExternesController } from "./quart-liens-externes.controller";
import { QuartLiensExternesService } from "./quart-liens-externes.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("QuartLiensExternesController", () => {
  let controller: QuartLiensExternesController;

  const mockService = {
    findAll: jest.fn(),
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
      controllers: [QuartLiensExternesController],
      providers: [
        { provide: QuartLiensExternesService, useValue: mockService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<QuartLiensExternesController>(
      QuartLiensExternesController
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
    it("should delegate to service with idUsine", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { nom: "Link", url: "https://example.com" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith(1, {
        nom: "Link",
        url: "https://example.com",
      });
    });
  });

  describe("update", () => {
    it("should return message", async () => {
      mockService.update.mockResolvedValue(undefined);

      const result = await controller.update(
        1,
        { nom: "Updated" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({
        message: "Lien externe mis à jour avec succès",
      });
    });
  });
});
