import { HttpsRedirectMiddleware } from "./https-redirect.middleware";

describe("HttpsRedirectMiddleware", () => {
  let middleware: HttpsRedirectMiddleware;

  const mockConfigService = {
    get: jest.fn(),
  };

  const createMockReq = (overrides: Record<string, any> = {}) => ({
    hostname: "example.com",
    headers: {},
    secure: false,
    originalUrl: "/api/test",
    ...overrides,
  });

  const createMockRes = () => ({
    redirect: jest.fn(),
  });

  beforeEach(() => {
    middleware = new HttpsRedirectMiddleware(mockConfigService as any);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  describe("non-production environment", () => {
    it("should pass through in dev environment", () => {
      mockConfigService.get.mockReturnValue("dev");
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should pass through in preprod environment", () => {
      mockConfigService.get.mockReturnValue("preprod");
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue("prod");
    });

    it("should redirect HTTP to HTTPS", () => {
      const req = createMockReq({ secure: false });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com/api/test"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass through HTTPS requests", () => {
      const req = createMockReq({ secure: true });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should pass through when X-Forwarded-Proto is https", () => {
      const req = createMockReq({
        headers: { "x-forwarded-proto": "https" },
      });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should skip redirect for localhost", () => {
      const req = createMockReq({ hostname: "localhost" });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should skip redirect for 127.0.0.1", () => {
      const req = createMockReq({ hostname: "127.0.0.1" });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it("should skip redirect for 10.x.x.x addresses", () => {
      const req = createMockReq({ hostname: "10.0.0.5" });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it("should skip redirect for 192.168.x.x addresses", () => {
      const req = createMockReq({ hostname: "192.168.1.100" });
      const res = createMockRes();
      const next = jest.fn();

      middleware.use(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
