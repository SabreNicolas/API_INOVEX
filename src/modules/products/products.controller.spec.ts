import { Test, TestingModule } from "@nestjs/testing";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ProductsController", () => {
  let controller: ProductsController;

  const mockService = {
    findAll: jest.fn(),
    findArrets: jest.fn(),
    findAllTypes: jest.fn(),
    findAllSortants: jest.fn(),
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
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service with idUsine", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith({}, 1);
    });
  });

  describe("findArrets", () => {
    it("should delegate to service", async () => {
      mockService.findArrets.mockResolvedValue([]);

      await controller.findArrets(mockCurrentUser as any);

      expect(mockService.findArrets).toHaveBeenCalledWith(1);
    });
  });

  describe("findAllTypes", () => {
    it("should return types", async () => {
      mockService.findAllTypes.mockResolvedValue([]);

      const result = await controller.findAllTypes();

      expect(result).toEqual([]);
    });
  });

  describe("findAllSortants", () => {
    it("should delegate to service", async () => {
      mockService.findAllSortants.mockResolvedValue([]);

      await controller.findAllSortants({} as any, mockCurrentUser as any);

      expect(mockService.findAllSortants).toHaveBeenCalledWith({}, 1);
    });
  });
});
