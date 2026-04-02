import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";

import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const createMockHost = () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockRequest = { method: "GET", url: "/test" };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      mockJson,
      mockStatus,
    };
  };

  beforeEach(() => {
    filter = new HttpExceptionFilter(mockLogger as any);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  describe("HttpException handling", () => {
    it("should handle HttpException with string response", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);

      filter.catch(exception, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not Found",
          path: "/test",
        })
      );
    });

    it("should handle HttpException with object response", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const exception = new HttpException(
        { message: "Validation failed", errors: ["field is required"] },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
        })
      );
    });
  });

  describe("SQL Server error handling", () => {
    it("should handle UNIQUE KEY violation (2627)", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("Unique key violation") as any;
      error.number = 2627;

      filter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Cette valeur existe déjà",
        })
      );
    });

    it("should handle unique index violation (2601)", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("Unique index violation") as any;
      error.number = 2601;

      filter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Cette valeur existe déjà",
        })
      );
    });

    it("should handle FOREIGN KEY violation (547)", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("FK violation") as any;
      error.number = 547;

      filter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            "Référence invalide - l'élément référencé n'existe pas ou est utilisé ailleurs",
        })
      );
    });

    it("should handle unknown SQL error numbers", () => {
      const { switchToHttp, mockStatus } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("Unknown SQL error") as any;
      error.number = 9999;

      filter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Erreur base de données non gérée",
        expect.any(String),
        "DatabaseError"
      );
    });
  });

  describe("Generic error handling", () => {
    it("should handle generic Error", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("Something went wrong");

      filter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
        })
      );
    });

    it("should handle non-Error exceptions", () => {
      const { switchToHttp, mockStatus, mockJson } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;

      filter.catch("string error", host);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("should log all errors", () => {
      const { switchToHttp } = createMockHost();
      const host = { switchToHttp } as unknown as ArgumentsHost;
      const error = new Error("Test error");

      filter.catch(error, host);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("GET /test"),
        expect.any(String),
        "HttpExceptionFilter"
      );
    });
  });

  it("should include timestamp in response", () => {
    const { switchToHttp, mockJson } = createMockHost();
    const host = { switchToHttp } as unknown as ArgumentsHost;

    filter.catch(new Error("test"), host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    );
  });
});
