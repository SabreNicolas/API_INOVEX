import { PartialType } from "@nestjs/swagger";

import { CreateImportTonnageReactifDto } from "./create-import-tonnage-reactif.dto";

export class UpdateImportTonnageReactifDto extends PartialType(
  CreateImportTonnageReactifDto
) {}
