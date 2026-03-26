import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    example: "Password123@",
    description: "Mot de passe actuel de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: "Le mot de passe actuel est requis" })
  @MaxLength(128, {
    message: "Le mot de passe actuel ne peut pas dépasser 128 caractères",
  })
  currentPassword: string;

  @ApiProperty({
    example: "Password123@",
    description: "Nouveau mot de passe de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nouveau mot de passe est requis" })
  @MaxLength(128, {
    message: "Le nouveau mot de passe ne peut pas dépasser 128 caractères",
  })
  newPassword: string;

  @ApiProperty({
    example: "test",
    description: "Login de l'utilisateur",
  })
  @IsNotEmpty({ message: "Le login de l'utilisateur est requis" })
  login: string;
}
