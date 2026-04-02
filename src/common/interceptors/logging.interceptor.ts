import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { LoggerService } from "../services/logger.service";

interface RequestWithUser extends Request {
  user?: { id?: number; idUsine?: number };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    this.logger.debug(`Incoming: ${request.method} ${request.url}`, "HTTP");

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.logRequest(
          request.method,
          request.url,
          response.statusCode,
          responseTime,
          request.user?.id,
          request.user?.idUsine
        );
      })
    );
  }
}
