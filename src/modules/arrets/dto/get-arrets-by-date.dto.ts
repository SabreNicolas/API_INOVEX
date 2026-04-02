import { IsString } from "class-validator";

import { PaginationDto } from "@/common/dto";

export class GetArretsByDateDto extends PaginationDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
