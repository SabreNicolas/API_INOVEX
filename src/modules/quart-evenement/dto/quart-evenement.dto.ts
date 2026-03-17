import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateQuartEvenementDto {
  @ApiProperty({
    example: "Panne équipement",
    description: "Titre de l'événement",
  })
  @IsString()
  @IsNotEmpty({ message: "Le titre est requis" })
  @MaxLength(250, { message: "Le titre ne peut pas dépasser 250 caractères" })
  titre: string;

  @ApiProperty({
    example: "Description détaillée de l'événement",
    description: "Description de l'événement",
  })
  @IsString()
  @IsNotEmpty({ message: "La description est requise" })
  @MaxLength(1000, {
    message: "La description ne peut pas dépasser 1000 caractères",
  })
  description: string;

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
    example: "Groupement A",
    description: "Groupement GMAO",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  groupementGMAO?: string;

  @ApiPropertyOptional({
    example: "Équipement B",
    description: "Équipement GMAO",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  equipementGMAO?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Niveau d'importance (1-3)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  importance?: number;

  @ApiPropertyOptional({
    example: "0",
    description: "Demande de travaux",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  demande_travaux?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Consigne associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  consigne?: number;

  @ApiPropertyOptional({
    example: "Usure",
    description: "Cause de l'événement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  cause?: string;

  @ApiPropertyOptional({
    example: "https://example.com/doc.pdf",
    description: "URL associée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  url?: string;
}

export class UpdateQuartEvenementDto {
  @ApiPropertyOptional({
    example: "Panne équipement modifiée",
    description: "Titre de l'événement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  titre?: string;

  @ApiPropertyOptional({
    example: "Description mise à jour",
    description: "Description de l'événement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
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
    example: "Groupement A",
    description: "Groupement GMAO",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  groupementGMAO?: string;

  @ApiPropertyOptional({
    example: "Équipement B",
    description: "Équipement GMAO",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  equipementGMAO?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Niveau d'importance",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  importance?: number;

  @ApiPropertyOptional({
    example: "0",
    description: "Demande de travaux",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  demande_travaux?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Consigne associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  consigne?: number;

  @ApiPropertyOptional({
    example: "Usure",
    description: "Cause de l'événement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  cause?: string;

  @ApiPropertyOptional({
    example: "https://example.com/doc.pdf",
    description: "URL associée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  url?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Actif (1) ou inactif (0)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isActive?: number;
}
