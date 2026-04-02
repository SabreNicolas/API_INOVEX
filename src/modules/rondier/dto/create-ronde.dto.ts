import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateMesureRondierDto {
  @ApiProperty({
    description: "ID de l'élément de contrôle",
    example: 1,
  })
  @IsInt({ message: "L'ID de l'élément doit être un entier" })
  elementId: number;

  @ApiPropertyOptional({
    description: "Mode du régulateur",
    example: "AUTO",
    maxLength: 25,
  })
  @IsOptional()
  @IsString({
    message: "Le mode régulateur doit être une chaîne de caractères",
  })
  @MaxLength(25, {
    message: "Le mode régulateur ne doit pas dépasser 25 caractères",
  })
  modeRegulateur?: string;

  @ApiPropertyOptional({
    description: "Valeur de la mesure",
    example: "42.5",
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "La valeur doit être une chaîne de caractères" })
  @MaxLength(255, { message: "La valeur ne doit pas dépasser 255 caractères" })
  value?: string;
}

export class CreateRondeDto {
  @ApiPropertyOptional({
    description: "Date et heure de la ronde (format string)",
    example: "2026-03-23 08:00:00",
  })
  @IsOptional()
  @IsString({ message: "La date/heure doit être une chaîne de caractères" })
  @MaxLength(255, {
    message: "La date/heure ne doit pas dépasser 255 caractères",
  })
  dateHeure?: string;

  @ApiProperty({
    description: "Numéro du quart (1 = matin, 2 = après-midi, 3 = nuit)",
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  @Type(() => Number)
  @IsInt({ message: "Le quart doit être un entier" })
  @Min(1, { message: "Le quart doit être au minimum 1" })
  @Max(3, { message: "Le quart doit être au maximum 3" })
  quart: number;

  @ApiPropertyOptional({
    description: "Commentaire de la ronde",
    example: "RAS",
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "Le commentaire doit être une chaîne de caractères" })
  @MaxLength(255, {
    message: "Le commentaire ne doit pas dépasser 255 caractères",
  })
  commentaire?: string;

  @ApiPropertyOptional({
    description: "La ronde est-elle terminée ?",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isFinished doit être un booléen" })
  isFinished?: boolean;

  @ApiPropertyOptional({
    description: "Four 1 en fonctionnement",
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: "fonctFour1 doit être un booléen" })
  fonctFour1?: boolean;

  @ApiPropertyOptional({
    description: "Four 2 en fonctionnement",
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: "fonctFour2 doit être un booléen" })
  fonctFour2?: boolean;

  @ApiPropertyOptional({
    description: "Four 3 en fonctionnement",
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: "fonctFour3 doit être un booléen" })
  fonctFour3?: boolean;

  @ApiPropertyOptional({
    description: "Four 4 en fonctionnement",
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: "fonctFour4 doit être un booléen" })
  fonctFour4?: boolean;

  @ApiPropertyOptional({
    description: "ID du chef de quart",
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "L'ID du chef de quart doit être un entier" })
  chefQuartId?: number;

  @ApiPropertyOptional({
    description: "ID de la reprise de ronde à marquer comme terminée",
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "L'ID de la reprise de ronde doit être un entier" })
  repriseRondeId?: number;

  @ApiProperty({
    description: "Liste des mesures rondier à créer",
    type: [CreateMesureRondierDto],
  })
  @IsArray({ message: "Les mesures doivent être un tableau" })
  @ValidateNested({ each: true })
  @Type(() => CreateMesureRondierDto)
  mesures: CreateMesureRondierDto[];
}
