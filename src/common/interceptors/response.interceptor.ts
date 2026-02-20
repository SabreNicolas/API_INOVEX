import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // Si la réponse est déjà formatée, la retourner telle quelle
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }

        // Si c'est une réponse paginée (avec data et meta), aplatir la structure
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "meta" in data
        ) {
          return {
            success: true,
            message: "Opération réussie",
            data: data.data,
            meta: data.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Format standard de réponse
        return {
          success: true,
          message: "Opération réussie",
          data,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}
