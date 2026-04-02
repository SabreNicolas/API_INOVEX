import { Test, TestingModule } from "@nestjs/testing";

import { ValidationDonneesController } from "./validation-donnees.controller";
import { ValidationDonneesService } from "./validation-donnees.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ValidationDonneesController", () => {
  let controller: ValidationDonneesController;

  const mockService = {
    findByAnneeAndMois: jest.fn(),
    create: jest.fn(),
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
      controllers: [ValidationDonneesController],
      providers: [{ provide: ValidationDonneesService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ValidationDonneesController>(
      ValidationDonneesController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findByAnneeAndMois", () => {
    it("should delegate to service", async () => {
      mockService.findByAnneeAndMois.mockResolvedValue([]);

      const result = await controller.findByAnneeAndMois(
        "2026",
        "03",
        mockCurrentUser as any
      );

      expect(result).toEqual([]);
      expect(mockService.findByAnneeAndMois).toHaveBeenCalledWith(
        1,
        "2026",
        "03"
      );
    });
  });

  describe("create", () => {
    it("should delegate to service with idUsine and userId", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        { moisValidation: "03", anneeValidation: "2026" } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith(
        { moisValidation: "03", anneeValidation: "2026" },
        1,
        1
      );
    });
  });
});
