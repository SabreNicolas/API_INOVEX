import { Test, TestingModule } from "@nestjs/testing";

import { FormulaireController } from "./formulaire.controller";
import { FormulaireService } from "./formulaire.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("FormulaireController", () => {
  let controller: FormulaireController;

  const mockService = {
    findAll: jest.fn(),
    findAllWithProducts: jest.fn(),
    findOne: jest.fn(),
    findProductsWithMeasures: jest.fn(),
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
      controllers: [FormulaireController],
      providers: [{ provide: FormulaireService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<FormulaireController>(FormulaireController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllWithProducts", () => {
    it("should delegate with idUsine", async () => {
      mockService.findAllWithProducts.mockResolvedValue([]);

      await controller.findAllWithProducts({} as any, mockCurrentUser as any);

      expect(mockService.findAllWithProducts).toHaveBeenCalledWith({}, 1);
    });
  });

  describe("findOne", () => {
    it("should return formulaire", async () => {
      mockService.findOne.mockResolvedValue({ idFormulaire: 1 });

      const result = await controller.findOne(1);

      expect(result.idFormulaire).toBe(1);
    });
  });
});
