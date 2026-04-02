import { Test, TestingModule } from "@nestjs/testing";

import { ImportTonnageSortantController } from "./import-tonnage-sortant.controller";
import { ImportTonnageSortantService } from "./import-tonnage-sortant.service";
import { AuthGuard } from "../../../common/guards/auth.guard";

describe("ImportTonnageSortantController", () => {
  let controller: ImportTonnageSortantController;

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
      controllers: [ImportTonnageSortantController],
      providers: [
        { provide: ImportTonnageSortantService, useValue: mockService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ImportTonnageSortantController>(
      ImportTonnageSortantController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith({}, 1);
    });
  });
});
