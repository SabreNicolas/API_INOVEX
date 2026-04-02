import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";

export class CreateRapportDto {
  @ApiProperty({
    example: "Rapport journalier",
    description: "Nom du rapport",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
  nom: string;

  @ApiProperty({
    example: "https://powerbi.com/report/123",
    description: "URL du rapport",
  })
  @IsString()
  @IsNotEmpty({ message: "L'URL est requise" })
  url: string;

  @ApiProperty({
    example: 1,
    description: "ID du site associé",
  })
  @IsInt({ message: "L'ID du site doit être un entier" })
  @Min(1, { message: "L'ID du site doit être supérieur à 0" })
  idUsine: number;
}
