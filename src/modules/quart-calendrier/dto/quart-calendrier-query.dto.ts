import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

export class QuartCalendrierQueryDto {
  @ApiProperty({
    description: "Date de début (format ISO)",
    example: "2026-03-01T00:00:00",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Date de fin (format ISO)",
    example: "2026-03-31T23:59:59",
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: "Numéro de la page (commence à 1)",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La page doit être un entier" })
  @Min(1, { message: "La page doit être au moins 1" })
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un entier" })
  @Min(1, { message: "La limite doit être au moins 1" })
  @Max(100, { message: "La limite ne peut pas dépasser 100" })
  limit?: number = 20;
}
