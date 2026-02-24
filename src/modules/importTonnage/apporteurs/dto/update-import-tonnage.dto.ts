import { PartialType } from "@nestjs/swagger";

import { CreateImportTonnageDto } from "./create-import-tonnage.dto";

export class UpdateImportTonnageDto extends PartialType(
  CreateImportTonnageDto
) {}
