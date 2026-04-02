import { IsString } from "class-validator";

import { PaginationDto } from "@/common/dto";

export class GetDepassementsByDateDto extends PaginationDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
