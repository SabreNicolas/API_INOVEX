import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAnomalieDto {
  @ApiPropertyOptional({
    example: 1,
    description: "ID de la ronde associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de ronde doit être un entier" })
  rondeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de la zone associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de zone doit être un entier" })
  zoneId?: number;

  @ApiPropertyOptional({
    example: "Fuite détectée sur le tuyau principal",
    description: "Commentaire de l'anomalie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Le commentaire ne peut pas dépasser 255 caractères",
  })
  commentaire?: string;

  @ApiPropertyOptional({
    example: "photo_anomalie.jpg",
    description: "Photo associée à l'anomalie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  photo?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Événement associé",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  evenement?: number;
}

export class UpdateAnomalieDto {
  @ApiPropertyOptional({
    example: 1,
    description: "ID de la ronde associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de ronde doit être un entier" })
  rondeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de la zone associée",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de zone doit être un entier" })
  zoneId?: number;

  @ApiPropertyOptional({
    example: "Commentaire mis à jour",
    description: "Commentaire de l'anomalie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Le commentaire ne peut pas dépasser 255 caractères",
  })
  commentaire?: string;

  @ApiPropertyOptional({
    example: "photo_anomalie_updated.jpg",
    description: "Photo associée à l'anomalie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  photo?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Événement associé",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  evenement?: number;
}
