import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export enum FileCategory {
  CONSIGNES = "consignes",
  QUART_EVENEMENTS = "quart-evenements",
  MODE_OPERATOIRE = "mode-operatoire",
}

export class ExportFilesDto {
  @ApiProperty({
    description: "Catégorie de fichiers à exporter",
    enum: FileCategory,
    example: FileCategory.CONSIGNES,
  })
  @IsEnum(FileCategory, {
    message:
      "La catégorie doit être: consignes, quart-evenements ou mode-operatoire",
  })
  category: FileCategory;

  @ApiProperty({
    description: "Années des fichiers à exporter",
    example: [2025, 2026],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Au moins une année doit être spécifiée" })
  @IsInt({ each: true, message: "Chaque année doit être un entier" })
  @Min(2000, { each: true })
  @Max(2100, { each: true })
  years: number[];

  @ApiProperty({
    description: "Mois des fichiers à exporter (1-12)",
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Au moins un mois doit être spécifié" })
  @IsInt({ each: true, message: "Chaque mois doit être un entier" })
  @Min(1, { each: true })
  @Max(12, { each: true })
  months: number[];

  @ApiPropertyOptional({
    description: "IDs des sites à exporter (tous les sites si non spécifié)",
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: "Chaque ID de site doit être un entier" })
  siteIds?: number[];
}
