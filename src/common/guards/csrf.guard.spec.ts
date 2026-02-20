import { ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CsrfGuard } from "./csrf.guard";

describe("CsrfGuard", () => {
  let guard: CsrfGuard;

  const mockConfigService = {
    get: jest.fn().mockReturnValue("prod"),
  };

  beforeEach(() => {
    guard = new CsrfGuard(mockConfigService as unknown as ConfigService);
  });

  const createMockContext = (
    method: string,
    path: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {}
  ): ExecutionContext => {
    const request = {
      method,
      path,
      url: path,
      cookies,
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow GET requests without CSRF token", () => {
    const context = createMockContext("GET", "/api/users");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow HEAD requests without CSRF token", () => {
    const context = createMockContext("HEAD", "/api/users");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow OPTIONS requests without CSRF token", () => {
    const context = createMockContext("OPTIONS", "/api/users");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow login endpoint without CSRF token", () => {
    const context = createMockContext("POST", "/api/auth/login");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow refresh endpoint without CSRF token", () => {
    const context = createMockContext("POST", "/api/auth/refresh");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow health check without CSRF token", () => {
    const context = createMockContext("POST", "/api/health");
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should reject POST without CSRF cookie", () => {
    const context = createMockContext("POST", "/api/users", {}, {});
    expect(() => guard.canActivate(context)).toThrow("Token CSRF manquant");
  });

  it("should reject POST without CSRF header", () => {
    const context = createMockContext(
      "POST",
      "/api/users",
      { "csrf-token": "sometoken" },
      {}
    );
    expect(() => guard.canActivate(context)).toThrow("Token CSRF manquant");
  });

  it("should reject POST when tokens don't match", () => {
    const context = createMockContext(
      "POST",
      "/api/users",
      { "csrf-token": "token1" },
      { "x-csrf-token": "token2" }
    );
    expect(() => guard.canActivate(context)).toThrow("Token CSRF invalide");
  });

  it("should allow POST when CSRF tokens match", () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      "POST",
      "/api/users",
      { "csrf-token": token },
      { "x-csrf-token": token }
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should generate unique tokens", () => {
    const token1 = CsrfGuard.generateToken();
    const token2 = CsrfGuard.generateToken();
    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64); // 32 bytes hex
  });
});
