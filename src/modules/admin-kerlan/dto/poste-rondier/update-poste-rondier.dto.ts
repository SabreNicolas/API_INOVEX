import { PartialType } from "@nestjs/swagger";
import { CreatePosteRondierDto } from "./create-poste-rondier.dto";

export class UpdatePosteRondierDto extends PartialType(CreatePosteRondierDto) {}
