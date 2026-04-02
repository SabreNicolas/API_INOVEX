import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateChoixDepassementDto {
  @ApiProperty({ description: "Nom du choix de dépassement", maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nom: string;
}

export class UpdateChoixDepassementDto extends PartialType(
  CreateChoixDepassementDto
) {}
