import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateActionEnregistrementDto {
  @ApiProperty({
    example: "Contrôle visuel",
    description: "Nom de l'action enregistrement",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(500, { message: "Le nom ne peut pas dépasser 500 caractères" })
  nom: string;
}

export class UpdateActionEnregistrementDto {
  @ApiPropertyOptional({
    example: "Contrôle visuel modifié",
    description: "Nom de l'action enregistrement",
  })
  @IsString()
  @MaxLength(500, { message: "Le nom ne peut pas dépasser 500 caractères" })
  nom: string;
}

export class CreateQuartActionDto {
  @ApiProperty({
    example: "Vérification des équipements",
    description: "Nom de l'action",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(1000, { message: "Le nom ne peut pas dépasser 1000 caractères" })
  nom: string;

  @ApiProperty({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsNotEmpty({ message: "La date de début est requise" })
  date_heure_debut: Date;

  @ApiProperty({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsNotEmpty({ message: "La date de fin est requise" })
  date_heure_fin: Date;
}

export class UpdateQuartActionDto {
  @ApiPropertyOptional({
    example: "Vérification des équipements modifiée",
    description: "Nom de l'action",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Le nom ne peut pas dépasser 1000 caractères" })
  nom?: string;

  @ApiPropertyOptional({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsOptional()
  date_heure_debut?: Date;

  @ApiPropertyOptional({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsOptional()
  date_heure_fin?: Date;
}
