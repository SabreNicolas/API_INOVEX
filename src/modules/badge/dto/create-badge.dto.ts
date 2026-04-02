import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateBadgeDto {
  @ApiProperty({
    example: "ABC123DEF456",
    description: "UID unique du badge",
  })
  @IsString()
  @IsNotEmpty({ message: "L'UID du badge est requis" })
  @MaxLength(20, { message: "L'UID ne peut pas dépasser 20 caractères" })
  uid: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'utilisateur à affecter (optionnel)",
  })
  @IsOptional()
  @IsInt({ message: "L'ID utilisateur doit être un entier" })
  userId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de la zone à affecter (optionnel)",
  })
  @IsOptional()
  @IsInt({ message: "L'ID de zone doit être un entier" })
  zoneId?: number;

  @ApiProperty({
    example: 1,
    description: "ID de l'usine",
  })
  @IsInt({ message: "L'ID usine doit être un entier" })
  @IsNotEmpty({ message: "L'ID usine est requis" })
  idUsine: number;
}
