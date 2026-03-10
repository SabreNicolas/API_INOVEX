import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateImportTonnageParametreSensDto {
  @ApiProperty({
    example: "Entrée",
    description: "Sens du paramètre",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le sens est requis" })
  @MaxLength(50, {
    message: "Le sens ne peut pas dépasser 50 caractères",
  })
  sens: string;

  @ApiProperty({
    example: "IN",
    description: "Correspondance dans le fichier d'import",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "La correspondance fichier est requise" })
  @MaxLength(50, {
    message: "La correspondance fichier ne peut pas dépasser 50 caractères",
  })
  correspondanceFichier: string;
}
