import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateModeOperatoireDto {
  @ApiPropertyOptional({ description: "Nom du mode opératoire" })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ description: "ID de la zone associée" })
  @IsInt()
  @IsOptional()
  zoneId?: number;
}
