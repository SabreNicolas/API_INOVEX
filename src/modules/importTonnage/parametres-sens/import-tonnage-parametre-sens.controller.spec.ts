import { Test, TestingModule } from "@nestjs/testing";

import { ImportTonnageParametreSensController } from "./import-tonnage-parametre-sens.controller";
import { ImportTonnageParametreSensService } from "./import-tonnage-parametre-sens.service";
import { AuthGuard } from "../../../common/guards/auth.guard";

describe("ImportTonnageParametreSensController", () => {
  let controller: ImportTonnageParametreSensController;

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportTonnageParametreSensController],
      providers: [
        { provide: ImportTonnageParametreSensService, useValue: mockService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ImportTonnageParametreSensController>(
      ImportTonnageParametreSensController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any);

      expect(mockService.findAll).toHaveBeenCalledWith({});
    });
  });
});
