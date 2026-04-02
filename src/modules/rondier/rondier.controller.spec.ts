import { Test, TestingModule } from "@nestjs/testing";

import { ZoneControleService } from "../zone-controle/zone-controle.service";
import { PdfGeneratorService } from "./pdf-generator.service";
import { RondeService } from "./ronde.service";
import { RondierController } from "./rondier.controller";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("RondierController", () => {
  let controller: RondierController;

  const mockRondeService = {
    findByDateAndQuart: jest.fn(),
    createRonde: jest.fn(),
    findRepriseRonde: jest.fn(),
    createRepriseRonde: jest.fn(),
    updateRepriseRonde: jest.fn(),
    deleteMesure: jest.fn(),
  };

  const mockZoneService = {
    findAllWithGroupementsAndElements: jest.fn(),
  };

  const mockPdfService = {
    generatePdf: jest.fn(),
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
      controllers: [RondierController],
      providers: [
        { provide: RondeService, useValue: mockRondeService },
        { provide: ZoneControleService, useValue: mockZoneService },
        { provide: PdfGeneratorService, useValue: mockPdfService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<RondierController>(RondierController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findRondesByDateAndQuart", () => {
    it("should delegate to service", async () => {
      mockRondeService.findByDateAndQuart.mockResolvedValue([]);

      const result = await controller.findRondesByDateAndQuart(
        { date: "2026-01-01", quart: 1 } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual([]);
      expect(mockRondeService.findByDateAndQuart).toHaveBeenCalledWith(
        1,
        "2026-01-01",
        1
      );
    });
  });

  describe("createRonde", () => {
    it("should create ronde", async () => {
      mockRondeService.createRonde.mockResolvedValue({ id: 1 });

      const result = await controller.createRonde(
        { quart: 1, mesures: [] } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
      expect(mockRondeService.createRonde).toHaveBeenCalledWith(1, 1, {
        quart: 1,
        mesures: [],
      });
    });
  });
});
