import { PartialType } from "@nestjs/swagger";

import { CreateFormulaireDto } from "./create-formulaire.dto";

export class UpdateFormulaireDto extends PartialType(CreateFormulaireDto) {}
