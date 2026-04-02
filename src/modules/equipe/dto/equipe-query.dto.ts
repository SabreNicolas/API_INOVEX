import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, Min } from "class-validator";

export class EquipeQueryDto {
  @ApiProperty({
    description: "Date (format ISO, ex: 2026-03-18)",
    example: "2026-03-18",
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: "Numéro de quart (1=matin, 2=après-midi, 3=nuit)",
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quart: number;
}
