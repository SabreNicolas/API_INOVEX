import { Test, TestingModule } from "@nestjs/testing";

import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("ExportController", () => {
  let controller: ExportController;

  const mockService = {
    exportFiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [{ provide: ExportService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<ExportController>(ExportController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("exportFiles", () => {
    it("should stream ZIP response", async () => {
      const mockStream = { pipe: jest.fn() };
      mockService.exportFiles.mockResolvedValue({
        stream: mockStream,
        filename: "export.zip",
      });

      const mockRes = {
        setHeader: jest.fn(),
      } as any;

      await controller.exportFiles({ category: "consignes" } as any, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/zip"
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });
  });
});
