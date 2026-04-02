import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

import { LoggerService } from "../services/logger.service";

interface SqlServerError extends Error {
  code?: string;
  number?: number;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Erreur interne du serveur";
    let details: unknown = null;

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        details = resp.errors || resp.details || null;
      } else {
        message = exceptionResponse as string;
      }
    }
    // Handle SQL Server errors
    else if (exception instanceof Error) {
      const sqlError = exception as SqlServerError;
      if (sqlError.number) {
        switch (sqlError.number) {
          case 2627: // Violation de contrainte UNIQUE KEY
          case 2601: // Violation d'index unique
            status = HttpStatus.CONFLICT;
            message = "Cette valeur existe déjà";
            break;
          case 547: // Violation de contrainte FOREIGN KEY
            status = HttpStatus.BAD_REQUEST;
            message =
              "Référence invalide - l'élément référencé n'existe pas ou est utilisé ailleurs";
            break;
          default:
            this.logger.error(
              "Erreur base de données non gérée",
              JSON.stringify({
                number: sqlError.number,
                message: sqlError.message,
              }),
              "DatabaseError"
            );
        }
      } else {
        message = exception.message;
      }
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
      "HttpExceptionFilter"
    );

    // Build response object
    const responseBody: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      responseBody.errors = details;
    }

    // Send response
    response.status(status).json(responseBody);
  }
}
