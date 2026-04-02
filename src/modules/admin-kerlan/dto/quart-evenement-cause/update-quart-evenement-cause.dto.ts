import { PartialType } from "@nestjs/swagger";

import { CreateQuartEvenementCauseDto } from "./create-quart-evenement-cause.dto";

export class UpdateQuartEvenementCauseDto extends PartialType(
  CreateQuartEvenementCauseDto
) {}
