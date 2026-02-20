import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    example: "newuser",
    description: "Identifiant de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: "Le login est requis" })
  @MaxLength(50, { message: "Le login ne peut pas dépasser 50 caractères" })
  login: string;

  @ApiProperty({
    example: "Password1!",
    description:
      "Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)",
  })
  @IsString()
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @MinLength(8, {
    message: "Le mot de passe doit contenir au moins 8 caractères",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
  })
  password: string;

  @ApiProperty({ example: "Dupont", description: "Nom de famille" })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(100, { message: "Le nom ne peut pas dépasser 100 caractères" })
  nom: string;

  @ApiProperty({ example: "Jean", description: "Prénom" })
  @IsString()
  @IsNotEmpty({ message: "Le prénom est requis" })
  @MaxLength(100, { message: "Le prénom ne peut pas dépasser 100 caractères" })
  prenom: string;

  @ApiPropertyOptional({ example: false, description: "Est administrateur" })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est vétérinaire" })
  @IsBoolean()
  @IsOptional()
  isVeto?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est éditeur" })
  @IsBoolean()
  @IsOptional()
  isEditeur?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: "Est lecteur",
  })
  @IsBoolean()
  @IsOptional()
  isLecteur?: boolean;
}
