import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateModeOperatoireDto {
  @ApiProperty({ description: "Nom du mode opératoire" })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: "ID de la zone associée" })
  @IsInt()
  @IsOptional()
  zoneId?: number;
}
