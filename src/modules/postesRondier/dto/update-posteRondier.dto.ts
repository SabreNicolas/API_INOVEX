import { PartialType } from "@nestjs/swagger";

import { CreatePosteRondierDto } from "./create-posteRondier.dto";

export class UpdatePosteRondierDto extends PartialType(CreatePosteRondierDto) {}
