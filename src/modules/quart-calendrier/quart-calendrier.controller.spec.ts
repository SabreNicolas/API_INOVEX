import { Test, TestingModule } from "@nestjs/testing";

import { QuartCalendrierController } from "./quart-calendrier.controller";
import { QuartCalendrierService } from "./quart-calendrier.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("QuartCalendrierController", () => {
  let controller: QuartCalendrierController;

  const mockService = {
    findHorairesByDateAndQuart: jest.fn(),
    findByDateRange: jest.fn(),
    findZonesByDateRange: jest.fn(),
    findActionsByDateRange: jest.fn(),
    findOccurrences: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteOccurrence: jest.fn(),
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
      controllers: [QuartCalendrierController],
      providers: [{ provide: QuartCalendrierService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<QuartCalendrierController>(
      QuartCalendrierController
    );
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findHoraires", () => {
    it("should delegate to service", async () => {
      mockService.findHorairesByDateAndQuart.mockResolvedValue({
        date_heure_debut: new Date(),
        date_heure_fin: new Date(),
      });

      await controller.findHoraires(
        { date: "2026-01-01", quart: 1 } as any,
        mockCurrentUser as any
      );

      expect(mockService.findHorairesByDateAndQuart).toHaveBeenCalledWith(
        1,
        "2026-01-01",
        1
      );
    });
  });

  describe("findOccurrences", () => {
    it("should delegate to service", async () => {
      mockService.findOccurrences.mockResolvedValue([]);

      await controller.findOccurrences(mockCurrentUser as any);

      expect(mockService.findOccurrences).toHaveBeenCalledWith(1);
    });
  });
});
