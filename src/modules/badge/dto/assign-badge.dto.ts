import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class AssignBadgeToUserDto {
  @ApiProperty({
    example: 1,
    description: "ID de l'utilisateur à affecter au badge",
  })
  @IsInt({ message: "L'ID utilisateur doit être un entier" })
  @IsNotEmpty({ message: "L'ID utilisateur est requis" })
  userId: number;
}

export class AssignBadgeToZoneDto {
  @ApiProperty({
    example: 1,
    description: "ID de la zone à affecter au badge",
  })
  @IsInt({ message: "L'ID de zone doit être un entier" })
  @IsNotEmpty({ message: "L'ID de zone est requis" })
  zoneId: number;
}
