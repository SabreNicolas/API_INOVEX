import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateGroupementDto {
  @ApiProperty({
    example: "Groupement principal",
    description: "Nom du groupement",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom du groupement est requis" })
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  groupement: string;

  @ApiProperty({
    example: 1,
    description: "ID de la zone associée",
  })
  @IsInt({ message: "L'ID de zone doit être un entier" })
  @IsNotEmpty({ message: "L'ID de zone est requis" })
  zoneId: number;
}

export class UpdateGroupementDto {
  @ApiPropertyOptional({
    example: "Groupement modifié",
    description: "Nom du groupement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  groupement?: string;

  @ApiPropertyOptional({
    example: 2,
    description: "ID de la zone associée",
  })
  @IsOptional()
  @IsInt({ message: "L'ID de zone doit être un entier" })
  zoneId?: number;
}
