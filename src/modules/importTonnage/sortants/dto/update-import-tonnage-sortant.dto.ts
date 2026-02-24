import { PartialType } from "@nestjs/swagger";

import { CreateImportTonnageSortantDto } from "./create-import-tonnage-sortant.dto";

export class UpdateImportTonnageSortantDto extends PartialType(
  CreateImportTonnageSortantDto
) {}
