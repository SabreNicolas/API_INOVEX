import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateConsigneDto {
  @ApiProperty({
    example: "Consigne de sécurité",
    description: "Titre de la consigne",
  })
  @IsString()
  @IsNotEmpty({ message: "Le titre est requis" })
  @MaxLength(250, { message: "Le titre ne peut pas dépasser 250 caractères" })
  titre: string;

  @ApiPropertyOptional({
    example: "Description détaillée de la consigne",
    description: "Description/commentaire de la consigne",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: "La description ne peut pas dépasser 1000 caractères",
  })
  description?: string;

  @ApiPropertyOptional({
    example: "2026-03-01T08:00:00.000Z",
    description: "Date de début",
  })
  @IsOptional()
  date_heure_debut?: string;

  @ApiPropertyOptional({
    example: "2026-03-15T18:00:00.000Z",
    description: "Date de fin",
  })
  @IsOptional()
  date_heure_fin?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Type de consigne",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le type doit être un entier" })
  type?: number;

  @ApiPropertyOptional({
    example: "https://example.com/document.pdf",
    description: "URL associée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: "L'URL ne peut pas dépasser 250 caractères" })
  url?: string;

  @ApiProperty({
    example: 1,
    description: "ID de l'usine",
  })
  @Type(() => Number)
  @IsInt({ message: "L'ID usine doit être un entier" })
  @IsNotEmpty({ message: "L'ID usine est requis" })
  idUsine: number;
}

export class UpdateConsigneDto {
  @ApiPropertyOptional({
    example: "Consigne de sécurité modifiée",
    description: "Titre de la consigne",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: "Le titre ne peut pas dépasser 250 caractères" })
  titre?: string;

  @ApiPropertyOptional({
    example: "Description mise à jour",
    description: "Description/commentaire de la consigne",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: "La description ne peut pas dépasser 1000 caractères",
  })
  description?: string;

  @ApiPropertyOptional({
    example: "2026-03-01T08:00:00.000Z",
    description: "Date de début",
  })
  @IsOptional()
  date_heure_debut?: string;

  @ApiPropertyOptional({
    example: "2026-03-15T18:00:00.000Z",
    description: "Date de fin",
  })
  @IsOptional()
  date_heure_fin?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Type de consigne",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le type doit être un entier" })
  type?: number;

  @ApiPropertyOptional({
    example: "https://example.com/document.pdf",
    description: "URL associée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: "L'URL ne peut pas dépasser 250 caractères" })
  url?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Actif (1) ou inactif (0)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "isActive doit être un entier" })
  isActive?: number;
}
