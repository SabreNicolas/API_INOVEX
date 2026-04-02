import { Test, TestingModule } from "@nestjs/testing";

import { ImportTonnageReactifController } from "./import-tonnage-reactif.controller";
import { ImportTonnageReactifService } from "./import-tonnage-reactif.service";
import { AuthGuard } from "../../../common/guards/auth.guard";

describe("ImportTonnageReactifController", () => {
  let controller: ImportTonnageReactifController;

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
      controllers: [ImportTonnageReactifController],
      providers: [
        { provide: ImportTonnageReactifService, useValue: mockService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ImportTonnageReactifController>(
      ImportTonnageReactifController
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
