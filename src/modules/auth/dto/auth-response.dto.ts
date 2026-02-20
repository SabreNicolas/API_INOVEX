import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

/**
 * DTO de réponse pour l'utilisateur authentifié
 */
export class AuthUserResponseDto {
  @ApiProperty({ example: 1, description: "ID de l'utilisateur" })
  @Expose()
  id: number;

  @ApiProperty({ example: "johndoe", description: "Login de l'utilisateur" })
  @Expose()
  login: string;

  @ApiProperty({ example: "Doe", description: "Nom de famille" })
  @Expose()
  nom: string;

  @ApiProperty({ example: "John", description: "Prénom" })
  @Expose()
  prenom: string;

  @ApiProperty({ example: false, description: "Est administrateur" })
  @Expose()
  isAdmin: boolean;

  @ApiProperty({ example: false, description: "Est vétérinaire" })
  @Expose()
  isVeto: boolean;

  @ApiProperty({ example: false, description: "Est éditeur" })
  @Expose()
  isEditeur: boolean;

  @ApiProperty({ example: true, description: "Est lecteur" })
  @Expose()
  isLecteur: boolean;

  // Le mot de passe ne sera jamais inclus dans les réponses
  @Exclude()
  password?: string;

  constructor(partial: Partial<AuthUserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO de réponse pour le login réussi
 */
export class LoginResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: "Connexion réussie" })
  @Expose()
  message: string;

  @ApiProperty({ type: AuthUserResponseDto })
  @Expose()
  user: AuthUserResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
