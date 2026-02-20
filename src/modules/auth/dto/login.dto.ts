import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "admin",
    description: "Identifiant de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: "Le login est requis" })
  @MaxLength(50, { message: "Le login ne peut pas dépasser 50 caractères" })
  login: string;

  @ApiProperty({
    example: "Password123@",
    description: "Mot de passe de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @MaxLength(128, {
    message: "Le mot de passe ne peut pas dépasser 128 caractères",
  })
  password: string;
}
