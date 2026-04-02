import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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
    description: "Mot de passe (min 8 caractères)",
  })
  @IsString()
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @MinLength(8, {
    message: "Le mot de passe doit contenir au moins 8 caractères",
  })
  password: string;

  @ApiProperty({ example: "Dupont", description: "Nom de famille" })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  nom: string;

  @ApiProperty({ example: "Jean", description: "Prénom" })
  @IsString()
  @IsNotEmpty({ message: "Le prénom est requis" })
  @MaxLength(255, { message: "Le prénom ne peut pas dépasser 255 caractères" })
  prenom: string;

  @ApiPropertyOptional({
    example: "jean.dupont@example.com",
    description: "Adresse email",
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: "", description: "Login GMAO" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  loginGMAO?: string;

  @ApiPropertyOptional({ example: "", description: "Poste utilisateur" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  posteUser?: string;

  @ApiPropertyOptional({ example: false, description: "Est administrateur" })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est rondier" })
  @IsBoolean()
  @IsOptional()
  isRondier?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est saisie" })
  @IsBoolean()
  @IsOptional()
  isSaisie?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est QSE" })
  @IsBoolean()
  @IsOptional()
  isQSE?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est rapport" })
  @IsBoolean()
  @IsOptional()
  isRapport?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est chef de quart" })
  @IsBoolean()
  @IsOptional()
  isChefQuart?: boolean;

  @ApiPropertyOptional({ example: false, description: "Est super admin" })
  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({ example: false, description: "Reçoit les mails" })
  @IsBoolean()
  @IsOptional()
  isMail?: boolean;

  @ApiPropertyOptional({ example: true, description: "Est actif" })
  @IsBoolean()
  @IsOptional()
  isActif?: boolean;

  @ApiPropertyOptional({ example: 1, description: "ID de l'usine" })
  @IsInt()
  @IsOptional()
  idUsine?: number;
}
