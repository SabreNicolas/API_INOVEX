import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateQuartActualiteDto {
  @ApiProperty({
    example: "Maintenance planifiée",
    description: "Titre de l'actualité",
  })
  @IsString()
  @IsNotEmpty({ message: "Le titre est requis" })
  @MaxLength(250, { message: "Le titre ne peut pas dépasser 250 caractères" })
  titre: string;

  @ApiPropertyOptional({
    example: "Description détaillée de l'actualité",
    description: "Description de l'actualité",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: "La description ne peut pas dépasser 2000 caractères",
  })
  description?: string;

  @ApiProperty({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsNotEmpty({ message: "La date de début est requise" })
  date_heure_debut: string;

  @ApiProperty({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsNotEmpty({ message: "La date de fin est requise" })
  date_heure_fin: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Niveau d'importance (1-3)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  importance?: number;
  @ApiPropertyOptional({
    example: 1,
    description: "Quart (1) ou non (0)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isQuart?: number;
}

export class UpdateQuartActualiteDto {
  @ApiPropertyOptional({
    example: "Maintenance modifiée",
    description: "Titre de l'actualité",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  titre?: string;

  @ApiPropertyOptional({
    example: "Description mise à jour",
    description: "Description de l'actualité",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsOptional()
  date_heure_debut?: string;

  @ApiPropertyOptional({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsOptional()
  date_heure_fin?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Niveau d'importance",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  importance?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Quart (1) ou non (0)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isQuart?: number;
}

export class ActiveOnDateQueryDto {
  @ApiProperty({
    description: "DateTime (format ISO)",
    example: "2026-02-24T10:30:00",
  })
  @IsDateString()
  date: string;

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
