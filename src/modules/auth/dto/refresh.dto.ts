import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";

export class RefreshDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      "ID du site à utiliser (optionnel, réservé aux super admins pour changer de site)",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du site doit être un entier" })
  @Min(1, { message: "L'ID du site doit être supérieur à 0" })
  idUsine?: number;
}
