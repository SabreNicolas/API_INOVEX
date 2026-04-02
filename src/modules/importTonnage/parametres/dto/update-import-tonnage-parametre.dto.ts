import { PartialType } from "@nestjs/swagger";

import { CreateImportTonnageParametreDto } from "./create-import-tonnage-parametre.dto";

export class UpdateImportTonnageParametreDto extends PartialType(
  CreateImportTonnageParametreDto
) {}
