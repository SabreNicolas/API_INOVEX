import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

/**
 * DTO de réponse pour un utilisateur
 * Utilise class-transformer pour exclure les données sensibles
 */
export class UserResponseDto {
  @ApiProperty({ example: 1, description: "ID de l'utilisateur" })
  @Expose()
  Id: number;

  @ApiProperty({ example: "johndoe", description: "Login de l'utilisateur" })
  @Expose()
  login: string;

  @ApiProperty({ example: "Doe", description: "Nom de famille" })
  @Expose()
  Nom: string;

  @ApiProperty({ example: "John", description: "Prénom" })
  @Expose()
  Prenom: string;

  @ApiProperty({ example: "john@example.com", description: "Email" })
  @Expose()
  email: string;

  @ApiProperty({ example: "", description: "Login GMAO" })
  @Expose()
  loginGMAO: string;

  @ApiProperty({ example: "", description: "Poste utilisateur" })
  @Expose()
  posteUser: string;

  @ApiProperty({ example: false, description: "Est admin" })
  @Expose()
  isAdmin: boolean;

  @ApiProperty({ example: false, description: "Est rondier" })
  @Expose()
  isRondier: boolean;

  @ApiProperty({ example: false, description: "Est saisie" })
  @Expose()
  isSaisie: boolean;

  @ApiProperty({ example: false, description: "Est QSE" })
  @Expose()
  isQSE: boolean;

  @ApiProperty({ example: false, description: "Est rapport" })
  @Expose()
  isRapport: boolean;

  @ApiProperty({ example: false, description: "Est chef de quart" })
  @Expose()
  isChefQuart: boolean;

  @ApiProperty({ example: false, description: "Est super admin" })
  @Expose()
  isSuperAdmin: boolean;

  @ApiProperty({ example: false, description: "Reçoit les mails" })
  @Expose()
  isMail: boolean;

  @ApiProperty({ example: true, description: "Est actif" })
  @Expose()
  isActif: boolean;

  @ApiProperty({ example: 1, description: "ID de l'usine" })
  @Expose()
  idUsine: number;

  // Le mot de passe ne sera jamais inclus dans les réponses
  @Exclude()
  pwd?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
