import { PartialType } from "@nestjs/swagger";

import { CreateConsigneTypeDto } from "./create-consigne-type.dto";

export class UpdateConsigneTypeDto extends PartialType(CreateConsigneTypeDto) {}
