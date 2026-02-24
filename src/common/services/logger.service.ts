import { Injectable, Scope } from "@nestjs/common";
import * as winston from "winston";

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(
        ({ level, message, timestamp, context, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : "";
          return `[${timestamp}] [${level.toUpperCase()}] [${context || "App"}] ${message}${metaStr}`;
        }
      )
    );

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === "prod" ? "info" : "debug",
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), logFormat),
        }),
      ],
    });

    // Add file transports in production
    if (process.env.NODE_ENV === "prod") {
      this.logger.add(
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        })
      );
      this.logger.add(
        new winston.transports.File({
          filename: "logs/combined.log",
        })
      );
    }
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: number,
    idUsine?: number
  ): void {
    this.logger.info(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      context: "HTTP",
      userId,
      idUsine,
      responseTime,
      statusCode,
    });
  }
}
