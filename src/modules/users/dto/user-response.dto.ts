import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

/**
 * DTO de réponse pour un utilisateur
 * Utilise class-transformer pour exclure les données sensibles
 */
export class UserResponseDto {
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

  @ApiProperty({ example: false, description: "Est super admin" })
  @Expose()
  isSuperAdmin: boolean;

  @ApiProperty({ example: false, description: "Est admin" })
  @Expose()
  isAdmin: boolean;

  @ApiProperty({ example: false, description: "Est vétérinaire" })
  @Expose()
  isVeto: boolean;

  @ApiProperty({ example: true, description: "Est éditeur" })
  @Expose()
  isEditeur: boolean;

  // Le mot de passe ne sera jamais inclus dans les réponses
  @Exclude()
  password?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
