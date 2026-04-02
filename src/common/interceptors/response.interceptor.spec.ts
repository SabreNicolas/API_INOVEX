import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";

import { ResponseInterceptor } from "./response.interceptor";

describe("ResponseInterceptor", () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  const createMockExecutionContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  const createMockCallHandler = (returnValue: any): CallHandler => ({
    handle: () => of(returnValue),
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should wrap simple data in standard response format", done => {
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler({ id: 1, name: "Test" });

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.message).toBe("Opération réussie");
      expect(result.data).toEqual({ id: 1, name: "Test" });
      expect(result.timestamp).toBeDefined();
      done();
    });
  });

  it("should wrap array data in standard response format", done => {
    const context = createMockExecutionContext();
    const dataArray = [{ id: 1 }, { id: 2 }];
    const callHandler = createMockCallHandler(dataArray);

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dataArray);
      done();
    });
  });

  it("should return already-formatted response as-is", done => {
    const context = createMockExecutionContext();
    const formattedResponse = {
      success: true,
      message: "Custom message",
      data: { id: 1 },
      timestamp: "2024-01-01T00:00:00.000Z",
    };
    const callHandler = createMockCallHandler(formattedResponse);

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result).toEqual(formattedResponse);
      done();
    });
  });

  it("should handle paginated response with data and meta", done => {
    const context = createMockExecutionContext();
    const paginatedResponse = {
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    };
    const callHandler = createMockCallHandler(paginatedResponse);

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(paginatedResponse.data);
      expect(result.meta).toEqual(paginatedResponse.meta);
      expect(result.timestamp).toBeDefined();
      done();
    });
  });

  it("should handle null data", done => {
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler(null);

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      done();
    });
  });

  it("should handle undefined data", done => {
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler(undefined);

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      done();
    });
  });

  it("should handle primitive data types", done => {
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler("string response");

    interceptor.intercept(context, callHandler).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBe("string response");
      done();
    });
  });
});
