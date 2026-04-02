import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateRepriseRondeDto {
  @ApiPropertyOptional({
    description: "Statut de terminaison (0 = en cours, 1 = terminé)",
    example: 1,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le statut termine doit être un entier" })
  @Min(0, { message: "Le statut termine doit être 0 ou 1" })
  @Max(1, { message: "Le statut termine doit être 0 ou 1" })
  termine?: number;
}
