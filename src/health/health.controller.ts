import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { DataSource } from "typeorm";

import { UserRole } from "@/common/constants";

import { RequireRole } from "../common/decorators";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  database: {
    status: "connected" | "disconnected";
    latency?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@ApiTags("Health")
@Controller("health")
@SkipThrottle() // Les health probes ne doivent pas être rate-limited
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Vérifier l'état de santé de l'API (Admin)" })
  @ApiResponse({
    status: 200,
    description: "API en bonne santé",
  })
  @ApiResponse({
    status: 401,
    description: "Non authentifié",
  })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - Admin requis",
  })
  @ApiResponse({
    status: 503,
    description: "API indisponible",
  })
  async check(): Promise<HealthStatus> {
    let dbStatus: "connected" | "disconnected" = "disconnected";
    let dbLatency: number | undefined;

    // Test database connection
    try {
      const dbStart = Date.now();
      await this.dataSource.query("SELECT 1");
      dbLatency = Date.now() - dbStart;
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    const health: HealthStatus = {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024),
        total: Math.round(totalMemory / 1024 / 1024),
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
    };

    return health;
  }

  @Get("live")
  @ApiOperation({ summary: "Vérifier que l'API est en vie (liveness probe)" })
  @ApiResponse({ status: 200, description: "API en vie" })
  live(): { status: string } {
    return { status: "ok" };
  }

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Vérifier que l'API est prête (readiness probe)",
  })
  @ApiResponse({ status: 200, description: "API prête" })
  @ApiResponse({ status: 503, description: "API non prête" })
  async ready(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query("SELECT 1");
      return { status: "ready", database: "connected" };
    } catch {
      throw new ServiceUnavailableException({
        status: "not_ready",
        database: "disconnected",
      });
    }
  }
}
