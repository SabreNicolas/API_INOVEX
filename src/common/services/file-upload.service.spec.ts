import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as fs from "fs";

import { Site } from "../../entities";
import { FileUploadService } from "./file-upload.service";
import { LoggerService } from "./logger.service";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-uuid-1234"),
}));

describe("FileUploadService", () => {
  let service: FileUploadService;

  const mockSiteRepository = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        { provide: getRepositoryToken(Site), useValue: mockSiteRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateFile", () => {
    it("should throw if no file provided", () => {
      expect(() => service.validateFile(null as any)).toThrow(
        BadRequestException
      );
    });

    it("should throw for disallowed MIME type", () => {
      const file = {
        mimetype: "application/zip",
        size: 1000,
      } as Express.Multer.File;

      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it("should throw for file exceeding 10MB", () => {
      const file = {
        mimetype: "application/pdf",
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it("should accept valid PDF file", () => {
      const file = {
        mimetype: "application/pdf",
        size: 1024,
      } as Express.Multer.File;

      expect(() => service.validateFile(file)).not.toThrow();
    });

    it("should accept valid image files", () => {
      for (const mimetype of ["image/jpeg", "image/png", "image/gif"]) {
        const file = { mimetype, size: 1024 } as Express.Multer.File;
        expect(() => service.validateFile(file)).not.toThrow();
      }
    });

    it("should accept valid office documents", () => {
      const mimeTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      for (const mimetype of mimeTypes) {
        const file = { mimetype, size: 1024 } as Express.Multer.File;
        expect(() => service.validateFile(file)).not.toThrow();
      }
    });
  });

  describe("saveConsigneFile", () => {
    it("should save file and return file info", async () => {
      mockSiteRepository.findOne.mockResolvedValue({
        id: 1,
        localisation: "COUVIN",
      });

      const file = {
        originalname: "test.pdf",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("test content"),
      } as Express.Multer.File;

      const result = await service.saveConsigneFile(file, 1);

      expect(result).toHaveProperty("filename", "test-uuid-1234.pdf");
      expect(result).toHaveProperty("originalname", "test.pdf");
      expect(result.url).toContain("/uploads/consignes/COUVIN/");
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should throw if site not found", async () => {
      mockSiteRepository.findOne.mockResolvedValue(null);

      const file = {
        originalname: "test.pdf",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      await expect(service.saveConsigneFile(file, 999)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("saveModeOperatoireFile", () => {
    it("should save mode operatoire file", async () => {
      mockSiteRepository.findOne.mockResolvedValue({
        id: 1,
        localisation: "COUVIN",
      });

      const file = {
        originalname: "procedure.docx",
        mimetype:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 2048,
        buffer: Buffer.from("doc content"),
      } as Express.Multer.File;

      const result = await service.saveModeOperatoireFile(file, 1);

      expect(result.url).toContain("/uploads/mode-operatoire/COUVIN/");
      expect(result.filename).toBe("test-uuid-1234.docx");
    });
  });

  describe("saveQuartEvenementFile", () => {
    it("should save quart evenement file", async () => {
      mockSiteRepository.findOne.mockResolvedValue({
        id: 1,
        localisation: "COUVIN",
      });

      const file = {
        originalname: "photo.jpg",
        mimetype: "image/jpeg",
        size: 500,
        buffer: Buffer.from("image data"),
      } as Express.Multer.File;

      const result = await service.saveQuartEvenementFile(file, 1);

      expect(result.url).toContain("/uploads/quart-evenements/COUVIN/");
    });
  });

  describe("deleteFile", () => {
    it("should not delete if url does not start with expected prefix", () => {
      service.deleteFile("/invalid/path/file.pdf");

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it("should not delete if url is empty", () => {
      service.deleteFile("");

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe("deleteModeOperatoireFile", () => {
    it("should not delete if url prefix is wrong", () => {
      service.deleteModeOperatoireFile("/uploads/consignes/file.pdf");

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
