import { LoggerService } from "./logger.service";

describe("LoggerService", () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    loggerService = new LoggerService();
  });

  it("should be defined", () => {
    expect(loggerService).toBeDefined();
  });

  describe("log", () => {
    it("should log info message with context", () => {
      // Should not throw
      expect(() =>
        loggerService.log("Test message", "TestContext")
      ).not.toThrow();
    });

    it("should log info message without context", () => {
      expect(() => loggerService.log("Test message")).not.toThrow();
    });
  });

  describe("error", () => {
    it("should log error message with trace and context", () => {
      expect(() =>
        loggerService.error("Error message", "stack trace", "ErrorContext")
      ).not.toThrow();
    });

    it("should log error message without trace", () => {
      expect(() =>
        loggerService.error("Error message", undefined, "ErrorContext")
      ).not.toThrow();
    });

    it("should log error message without context", () => {
      expect(() => loggerService.error("Error message")).not.toThrow();
    });
  });

  describe("warn", () => {
    it("should log warning message with context", () => {
      expect(() =>
        loggerService.warn("Warning message", "WarnContext")
      ).not.toThrow();
    });

    it("should log warning message without context", () => {
      expect(() => loggerService.warn("Warning message")).not.toThrow();
    });
  });

  describe("debug", () => {
    it("should log debug message with context", () => {
      expect(() =>
        loggerService.debug("Debug message", "DebugContext")
      ).not.toThrow();
    });

    it("should log debug message without context", () => {
      expect(() => loggerService.debug("Debug message")).not.toThrow();
    });
  });

  describe("verbose", () => {
    it("should log verbose message with context", () => {
      expect(() =>
        loggerService.verbose("Verbose message", "VerboseContext")
      ).not.toThrow();
    });

    it("should log verbose message without context", () => {
      expect(() => loggerService.verbose("Verbose message")).not.toThrow();
    });
  });

  describe("logRequest", () => {
    it("should log HTTP request with all parameters", () => {
      expect(() =>
        loggerService.logRequest("GET", "/api/users", 200, 150, 1)
      ).not.toThrow();
    });

    it("should log HTTP request without userId", () => {
      expect(() =>
        loggerService.logRequest("POST", "/api/auth/login", 401, 50)
      ).not.toThrow();
    });

    it("should log different HTTP methods", () => {
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
      methods.forEach(method => {
        expect(() =>
          loggerService.logRequest(
            method,
            `/api/${method.toLowerCase()}`,
            200,
            100
          )
        ).not.toThrow();
      });
    });

    it("should log different status codes", () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];
      statusCodes.forEach(code => {
        expect(() =>
          loggerService.logRequest("GET", "/api/test", code, 100)
        ).not.toThrow();
      });
    });
  });
});
