import { PartialType } from "@nestjs/swagger";

import { CreateImportTonnageParametreSensDto } from "./create-import-tonnage-parametre-sens.dto";

export class UpdateImportTonnageParametreSensDto extends PartialType(
  CreateImportTonnageParametreSensDto
) {}
