import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";

import { LoggerService } from "../services/logger.service";
import { LoggingInterceptor } from "./logging.interceptor";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(() => {
    mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logRequest: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    interceptor = new LoggingInterceptor(mockLoggerService);
  });

  const createMockExecutionContext = (
    method = "GET",
    url = "/test",
    userId?: number
  ): ExecutionContext => {
    const mockRequest = {
      method,
      url,
      user: userId ? { id: userId } : undefined,
    };
    const mockResponse = {
      statusCode: 200,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: any = {}): CallHandler => ({
    handle: () => of(returnValue),
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should log incoming request", done => {
    const context = createMockExecutionContext("GET", "/api/users");
    const callHandler = createMockCallHandler({ data: "test" });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        "Incoming: GET /api/users",
        "HTTP"
      );
      done();
    });
  });

  it("should log request completion with timing", done => {
    const context = createMockExecutionContext("POST", "/api/users");
    const callHandler = createMockCallHandler({ id: 1 });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLoggerService.logRequest).toHaveBeenCalledWith(
        "POST",
        "/api/users",
        200,
        expect.any(Number),
        undefined
      );
      done();
    });
  });

  it("should include user id in log when authenticated", done => {
    const context = createMockExecutionContext("GET", "/api/me", 123);
    const callHandler = createMockCallHandler({ user: "test" });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLoggerService.logRequest).toHaveBeenCalledWith(
        "GET",
        "/api/me",
        200,
        expect.any(Number),
        123
      );
      done();
    });
  });

  it("should handle different HTTP methods", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

    methods.forEach(method => {
      const context = createMockExecutionContext(method, "/api/test");
      const callHandler = createMockCallHandler();

      interceptor.intercept(context, callHandler).subscribe(() => {
        expect(mockLoggerService.debug).toHaveBeenCalledWith(
          `Incoming: ${method} /api/test`,
          "HTTP"
        );
      });
    });
  });

  it("should calculate response time correctly", done => {
    const context = createMockExecutionContext("GET", "/api/slow");
    const callHandler = createMockCallHandler();

    const startTime = Date.now();

    interceptor.intercept(context, callHandler).subscribe(() => {
      const endTime = Date.now();
      const expectedMinTime = endTime - startTime;

      expect(mockLoggerService.logRequest).toHaveBeenCalledWith(
        "GET",
        "/api/slow",
        200,
        expect.any(Number),
        undefined
      );

      // Verify response time is reasonable (within test execution time)
      const actualResponseTime = mockLoggerService.logRequest.mock
        .calls[0][3] as number;
      expect(actualResponseTime).toBeLessThanOrEqual(expectedMinTime + 100);
      done();
    });
  });
});
