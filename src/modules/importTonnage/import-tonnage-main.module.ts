import { Module } from "@nestjs/common";

import { ImportTonnageModule as ImportTonnageApporteursModule } from "./apporteurs/import-tonnage.module";
import { ImportTonnageParametreModule } from "./parametres/import-tonnage-parametre.module";
import { ImportTonnageParametreSensModule } from "./parametres-sens/import-tonnage-parametre-sens.module";
import { ImportTonnageReactifModule } from "./reactifs/import-tonnage-reactif.module";
import { ImportTonnageSortantModule } from "./sortants/import-tonnage-sortant.module";

@Module({
  imports: [
    ImportTonnageApporteursModule,
    ImportTonnageReactifModule,
    ImportTonnageSortantModule,
    ImportTonnageParametreModule,
    ImportTonnageParametreSensModule,
  ],
  exports: [
    ImportTonnageApporteursModule,
    ImportTonnageReactifModule,
    ImportTonnageSortantModule,
    ImportTonnageParametreModule,
    ImportTonnageParametreSensModule,
  ],
})
export class ImportTonnageMainModule {}
