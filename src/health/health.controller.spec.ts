import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";

import { LoggerService } from "../common/services/logger.service";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("test-secret"),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dataSource = module.get<DataSource>(DataSource);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("check", () => {
    it("should return healthy status when database is connected", async () => {
      mockDataSource.query.mockResolvedValue([{ "1": 1 }]);

      const result = await controller.check();

      expect(result.status).toBe("healthy");
      expect(result.database.status).toBe("connected");
      expect(result.database.latency).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.memory.used).toBeGreaterThan(0);
      expect(result.memory.total).toBeGreaterThan(0);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it("should return unhealthy status when database is disconnected", async () => {
      mockDataSource.query.mockRejectedValue(new Error("Database error"));

      const result = await controller.check();

      expect(result.status).toBe("unhealthy");
      expect(result.database.status).toBe("disconnected");
      expect(result.database.latency).toBeUndefined();
    });
  });

  describe("live", () => {
    it("should return ok status", () => {
      const result = controller.live();

      expect(result).toEqual({ status: "ok" });
    });
  });

  describe("ready", () => {
    it("should return ready status when database is connected", async () => {
      mockDataSource.query.mockResolvedValue([{ "1": 1 }]);

      const result = await controller.ready();

      expect(result).toEqual({ status: "ready", database: "connected" });
    });

    it("should return not_ready status when database is disconnected", async () => {
      mockDataSource.query.mockRejectedValue(new Error("Database error"));

      const result = await controller.ready();

      expect(result).toEqual({ status: "not_ready", database: "disconnected" });
    });
  });
});
