import { Test, TestingModule } from "@nestjs/testing";

import { LoggerService } from "@/common/services/logger.service";

import { RegistreQuartController } from "./registre-quart.controller";
import { RegistreQuartPdfService } from "./registre-quart-pdf.service";
import { RegistreQuartService } from "./registre-quart.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("RegistreQuartController", () => {
  let controller: RegistreQuartController;

  const mockService = {
    getLastShift: jest.fn(),
    getRegistreData: jest.fn(),
  };

  const mockPdfService = {
    generateAndSave: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
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
      controllers: [RegistreQuartController],
      providers: [
        { provide: RegistreQuartService, useValue: mockService },
        { provide: RegistreQuartPdfService, useValue: mockPdfService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<RegistreQuartController>(RegistreQuartController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getLastShift", () => {
    it("should delegate to service", async () => {
      mockService.getLastShift.mockResolvedValue({
        date: "2026-01-15",
        quart: 2,
      });

      const result = await controller.getLastShift(mockCurrentUser as any);

      expect(result).toEqual({ date: "2026-01-15", quart: 2 });
      expect(mockService.getLastShift).toHaveBeenCalledWith(1);
    });
  });

  describe("downloadPdf", () => {
    it("should generate and stream PDF", async () => {
      const mockData = {
        siteName: "Site A",
        date: "15/01/2026",
        quartLabel: "Matin",
        quart: 1,
      };
      mockService.getRegistreData.mockResolvedValue(mockData);
      mockPdfService.generateAndSave.mockResolvedValue({
        buffer: Buffer.from("pdf"),
      });

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.downloadPdf(
        "2026-01-15",
        "1",
        mockCurrentUser as any,
        mockRes as any
      );

      expect(mockRes.set).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
