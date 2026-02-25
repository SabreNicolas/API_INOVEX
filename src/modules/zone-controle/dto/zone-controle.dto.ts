import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateZoneControleDto {
  @ApiProperty({
    example: "Zone A",
    description: "Nom de la zone",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(500, { message: "Le nom ne peut pas dépasser 500 caractères" })
  nom: string;

  @ApiPropertyOptional({
    example: "Zone de contrôle principale",
    description: "Commentaire sur la zone",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: "Le commentaire ne peut pas dépasser 500 caractères",
  })
  commentaire?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Numéro du four associé",
  })
  @IsOptional()
  @IsInt({ message: "Le four doit être un entier" })
  four?: number;

  @ApiProperty({
    example: 1,
    description: "ID de l'usine",
  })
  @IsInt({ message: "L'ID usine doit être un entier" })
  @IsNotEmpty({ message: "L'ID usine est requis" })
  idUsine: number;
}

export class UpdateZoneControleDto {
  @ApiPropertyOptional({
    example: "Zone B",
    description: "Nom de la zone",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Le nom ne peut pas dépasser 500 caractères" })
  nom?: string;

  @ApiPropertyOptional({
    example: "Commentaire mis à jour",
    description: "Commentaire sur la zone",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: "Le commentaire ne peut pas dépasser 500 caractères",
  })
  commentaire?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Numéro du four associé",
  })
  @IsOptional()
  @IsInt({ message: "Le four doit être un entier" })
  four?: number;
}
