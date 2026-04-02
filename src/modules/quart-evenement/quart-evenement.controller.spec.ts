import { Test, TestingModule } from "@nestjs/testing";

import { FileUploadService } from "../../common/services/file-upload.service";
import { QuartEvenementController } from "./quart-evenement.controller";
import { QuartEvenementService } from "./quart-evenement.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("QuartEvenementController", () => {
  let controller: QuartEvenementController;

  const mockService = {
    findAll: jest.fn(),
    findByDateRange: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFileUploadService = {
    saveQuartEvenementFile: jest.fn(),
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
      controllers: [QuartEvenementController],
      providers: [
        { provide: QuartEvenementService, useValue: mockService },
        { provide: FileUploadService, useValue: mockFileUploadService },
      ],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<QuartEvenementController>(QuartEvenementController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should delegate to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll({} as any, mockCurrentUser as any);

      expect(mockService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe("findByDateRange", () => {
    it("should delegate to service with parsed dates", async () => {
      mockService.findByDateRange.mockResolvedValue([]);

      await controller.findByDateRange(
        { dateDebut: "2026-01-01", dateFin: "2026-01-31" } as any,
        mockCurrentUser as any
      );

      expect(mockService.findByDateRange).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create without file", async () => {
      mockService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(
        {
          titre: "Event",
          date_heure_debut: "2026-01-01",
          date_heure_fin: "2026-01-02",
        } as any,
        mockCurrentUser as any
      );

      expect(result).toEqual({ id: 1 });
    });

    it("should create with file upload", async () => {
      mockFileUploadService.saveQuartEvenementFile.mockResolvedValue({
        url: "/uploads/file.pdf",
      });
      mockService.create.mockResolvedValue({ id: 1 });

      const file = {
        originalname: "test.pdf",
        buffer: Buffer.alloc(100),
      } as Express.Multer.File;

      const result = await controller.create(
        {
          titre: "Event",
          date_heure_debut: "2026-01-01",
          date_heure_fin: "2026-01-02",
        } as any,
        mockCurrentUser as any,
        file
      );

      expect(mockFileUploadService.saveQuartEvenementFile).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
  });
});
