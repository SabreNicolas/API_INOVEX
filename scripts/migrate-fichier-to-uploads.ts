/**
 * Script de migration des fichiers de /fichier/ vers /uploads/
 *
 * L'ancien système stockait tous les fichiers dans un dossier plat /fichier/.
 * Le nouveau système les organise par type et par site :
 *   - uploads/consignes/{site}/{year}/{month}/{uuid}.ext
 *   - uploads/quart-evenements/{site}/{year}/{month}/{uuid}.ext
 *   - uploads/mode-operatoire/{site}/{year}/{month}/{uuid}.ext
 *   - uploads/anomalies/{site}/{year}/{month}/{uuid}.ext
 *   - uploads/rondes/{site}/{year}/{month}/{uuid}.ext
 *
 * Tables migrées :
 *   - consigne.url
 *   - quart_evenement.url
 *   - modeoperatoire.fichier
 *   - anomalie.photo
 *   - ronde.urlPDF
 *
 * Usage :
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-fichier-to-uploads.ts --source /chemin/vers/fichier [--dry-run]
 */

import * as dotenv from "dotenv";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { basename, extname, join, resolve } from "path";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sourceIdx = args.indexOf("--source");
const sourceDir =
  sourceIdx !== -1 && args[sourceIdx + 1] ? resolve(args[sourceIdx + 1]) : null;

if (!sourceDir) {
  console.error(
    "Usage: npx ts-node -r tsconfig-paths/register scripts/migrate-fichier-to-uploads.ts --source /chemin/vers/fichier [--dry-run]"
  );
  process.exit(1);
}

const uploadsDir = resolve(process.cwd(), "uploads");

// ─── DB Connection ────────────────────────────────────────────────────────────

const nodeEnv = process.env.NODE_ENV || "dev";

function getDbConfig() {
  switch (nodeEnv) {
    case "prod":
      return {
        host: process.env.DB_HOST_PROD || "localhost",
        port: parseInt(process.env.DB_PORT_PROD || "1433", 10),
        username: process.env.DB_USER_PROD || "sa",
        password: process.env.DB_PASSWORD_PROD || "",
        database: process.env.DB_NAME_PROD || "cahier_soins",
      };
    case "preprod":
      return {
        host: process.env.DB_HOST_PREPROD || "localhost",
        port: parseInt(process.env.DB_PORT_PREPROD || "1433", 10),
        username: process.env.DB_USER_PREPROD || "sa",
        password: process.env.DB_PASSWORD_PREPROD || "",
        database: process.env.DB_NAME_PREPROD || "cahier_soins_preprod",
      };
    default:
      return {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "1433", 10),
        username: process.env.DB_USER || "sa",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "cahier_soins_dev",
      };
  }
}

const dataSource = new DataSource({
  type: "mssql",
  ...getDbConfig(),
  synchronize: false,
  options: {
    encrypt: nodeEnv === "prod" || nodeEnv === "preprod",
    trustServerCertificate: nodeEnv !== "prod",
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteInfo {
  id: number;
  localisation: string;
}

interface MigrationResult {
  table: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build an index of all physical files in the source dir (case-insensitive) */
function buildFileIndex(dir: string): Map<string, string> {
  const index = new Map<string, string>();
  if (!existsSync(dir)) return index;

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isFile()) {
      index.set(entry.toLowerCase(), full);
    }
  }
  return index;
}

/** Extract the bare filename from an old URL like /fichier/xxx.pdf or fichier/xxx.pdf */
function extractFilename(oldUrl: string): string {
  let name = oldUrl;
  // Normalise les différents formats possibles
  if (name.startsWith("/fichier/")) {
    name = name.substring("/fichier/".length);
  } else if (name.startsWith("fichier/")) {
    name = name.substring("fichier/".length);
  } else if (name.startsWith("/")) {
    name = name.substring(1);
  }
  // Si le path contient des sous-dossiers, garder uniquement le nom du fichier
  return basename(name);
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyFileToUploads(
  physicalPath: string,
  subFolder: string,
  siteLocalisation: string,
  referenceDate: Date | null
): string {
  const ext = extname(physicalPath) || ".bin";
  const newFilename = `${uuidv4()}${ext}`;
  const date = referenceDate || new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const destDir = join(uploadsDir, subFolder, siteLocalisation, year, month);
  ensureDir(destDir);

  const destPath = join(destDir, newFilename);

  if (!dryRun) {
    copyFileSync(physicalPath, destPath);
  }

  return `/uploads/${subFolder}/${siteLocalisation}/${year}/${month}/${newFilename}`;
}

// ─── Migration functions ──────────────────────────────────────────────────────

async function loadSites(): Promise<Map<number, SiteInfo>> {
  const rows: SiteInfo[] = await dataSource.query(
    "SELECT id, localisation FROM site"
  );
  const map = new Map<number, SiteInfo>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

/**
 * Migrate consigne.url
 * consigne has idUsine directly
 */
async function migrateConsignes(
  fileIndex: Map<string, string>,
  sites: Map<number, SiteInfo>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: "consigne",
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  const rows: {
    id: number;
    url: string;
    idUsine: number;
    date_heure_debut: Date | null;
  }[] = await dataSource.query(
    "SELECT id, url, idUsine, date_heure_debut FROM consigne WHERE url IS NOT NULL AND url != '' AND url NOT LIKE '/uploads/%'"
  );

  result.total = rows.length;
  console.log(`  [consigne] ${rows.length} enregistrements à migrer`);

  for (const row of rows) {
    const filename = extractFilename(row.url);
    const physicalPath = fileIndex.get(filename.toLowerCase());
    const site = sites.get(row.idUsine);

    if (!site) {
      result.errors.push(
        `consigne #${row.id}: site introuvable pour idUsine=${row.idUsine}`
      );
      result.skipped++;
      continue;
    }

    if (!physicalPath) {
      result.errors.push(
        `consigne #${row.id}: fichier '${filename}' introuvable dans le dossier source`
      );
      result.skipped++;
      continue;
    }

    const newUrl = copyFileToUploads(
      physicalPath,
      "consignes",
      site.localisation,
      row.date_heure_debut
    );

    if (!dryRun) {
      await dataSource.query("UPDATE consigne SET url = @0 WHERE id = @1", [
        newUrl,
        row.id,
      ]);
    }

    console.log(`    ✓ consigne #${row.id}: ${row.url} → ${newUrl}`);
    result.migrated++;
  }

  return result;
}

/**
 * Migrate quart_evenement.url
 * quart_evenement has idUsine directly
 */
async function migrateQuartEvenements(
  fileIndex: Map<string, string>,
  sites: Map<number, SiteInfo>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: "quart_evenement",
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  const rows: {
    id: number;
    url: string;
    idUsine: number;
    date_heure_debut: Date | null;
  }[] = await dataSource.query(
    "SELECT id, url, idUsine, date_heure_debut FROM quart_evenement WHERE url IS NOT NULL AND url != '' AND url NOT LIKE '/uploads/%'"
  );

  result.total = rows.length;
  console.log(`  [quart_evenement] ${rows.length} enregistrements à migrer`);

  for (const row of rows) {
    const filename = extractFilename(row.url);
    const physicalPath = fileIndex.get(filename.toLowerCase());
    const site = sites.get(row.idUsine);

    if (!site) {
      result.errors.push(
        `quart_evenement #${row.id}: site introuvable pour idUsine=${row.idUsine}`
      );
      result.skipped++;
      continue;
    }

    if (!physicalPath) {
      result.errors.push(
        `quart_evenement #${row.id}: fichier '${filename}' introuvable dans le dossier source`
      );
      result.skipped++;
      continue;
    }

    const newUrl = copyFileToUploads(
      physicalPath,
      "quart-evenements",
      site.localisation,
      row.date_heure_debut
    );

    if (!dryRun) {
      await dataSource.query(
        "UPDATE quart_evenement SET url = @0 WHERE id = @1",
        [newUrl, row.id]
      );
    }

    console.log(`    ✓ quart_evenement #${row.id}: ${row.url} → ${newUrl}`);
    result.migrated++;
  }

  return result;
}

/**
 * Migrate modeoperatoire.fichier
 * modeoperatoire has zoneId → zone_controle.idUsine
 */
async function migrateModeOperatoire(
  fileIndex: Map<string, string>,
  sites: Map<number, SiteInfo>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: "modeoperatoire",
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  const rows: { id: number; fichier: string; idUsine: number | null }[] =
    await dataSource.query(
      `SELECT m.id, m.fichier, z.idUsine
       FROM modeoperatoire m
       LEFT JOIN zonecontrole z ON m.zoneId = z.Id
       WHERE m.fichier IS NOT NULL AND m.fichier != '' AND m.fichier NOT LIKE '/uploads/%'`
    );

  result.total = rows.length;
  console.log(`  [modeoperatoire] ${rows.length} enregistrements à migrer`);

  for (const row of rows) {
    const filename = extractFilename(row.fichier);
    const physicalPath = fileIndex.get(filename.toLowerCase());
    const site = row.idUsine ? sites.get(row.idUsine) : null;

    if (!site) {
      result.errors.push(
        `modeoperatoire #${row.id}: site introuvable (zoneId sans idUsine)`
      );
      result.skipped++;
      continue;
    }

    if (!physicalPath) {
      result.errors.push(
        `modeoperatoire #${row.id}: fichier '${filename}' introuvable dans le dossier source`
      );
      result.skipped++;
      continue;
    }

    const newUrl = copyFileToUploads(
      physicalPath,
      "mode-operatoire",
      site.localisation,
      null
    );

    if (!dryRun) {
      await dataSource.query(
        "UPDATE modeoperatoire SET fichier = @0 WHERE id = @1",
        [newUrl, row.id]
      );
    }

    console.log(`    ✓ modeoperatoire #${row.id}: ${row.fichier} → ${newUrl}`);
    result.migrated++;
  }

  return result;
}

/**
 * Migrate anomalie.photo
 * anomalie has rondeId → ronde.idUsine OR zoneId → zone_controle.idUsine
 */
async function migrateAnomalies(
  fileIndex: Map<string, string>,
  sites: Map<number, SiteInfo>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: "anomalie",
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  const rows: { id: number; photo: string; idUsine: number | null }[] =
    await dataSource.query(
      `SELECT a.id, a.photo,
              COALESCE(r.idUsine, z.idUsine) AS idUsine
       FROM anomalie a
       LEFT JOIN ronde r ON a.rondeId = r.Id
       LEFT JOIN zonecontrole z ON a.zoneId = z.Id
       WHERE a.photo IS NOT NULL AND a.photo != '' AND a.photo NOT LIKE '/uploads/%'`
    );

  result.total = rows.length;
  console.log(`  [anomalie] ${rows.length} enregistrements à migrer`);

  for (const row of rows) {
    const filename = extractFilename(row.photo);
    const physicalPath = fileIndex.get(filename.toLowerCase());
    const site = row.idUsine ? sites.get(row.idUsine) : null;

    if (!site) {
      result.errors.push(`anomalie #${row.id}: site introuvable`);
      result.skipped++;
      continue;
    }

    if (!physicalPath) {
      result.errors.push(
        `anomalie #${row.id}: fichier '${filename}' introuvable dans le dossier source`
      );
      result.skipped++;
      continue;
    }

    const newUrl = copyFileToUploads(
      physicalPath,
      "anomalies",
      site.localisation,
      null
    );

    if (!dryRun) {
      await dataSource.query("UPDATE anomalie SET photo = @0 WHERE id = @1", [
        newUrl,
        row.id,
      ]);
    }

    console.log(`    ✓ anomalie #${row.id}: ${row.photo} → ${newUrl}`);
    result.migrated++;
  }

  return result;
}

/**
 * Migrate ronde.urlPDF
 * ronde has idUsine directly
 */
async function migrateRondes(
  fileIndex: Map<string, string>,
  sites: Map<number, SiteInfo>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: "ronde",
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  const rows: {
    id: number;
    urlPDF: string;
    idUsine: number;
    dateHeureCreation: Date | null;
  }[] = await dataSource.query(
    "SELECT Id as id, urlPDF, idUsine, dateHeureCreation FROM ronde WHERE urlPDF IS NOT NULL AND urlPDF != '' AND urlPDF NOT LIKE '/uploads/%'"
  );

  result.total = rows.length;
  console.log(`  [ronde] ${rows.length} enregistrements à migrer`);

  for (const row of rows) {
    const filename = extractFilename(row.urlPDF);
    const physicalPath = fileIndex.get(filename.toLowerCase());
    const site = sites.get(row.idUsine);

    if (!site) {
      result.errors.push(
        `ronde #${row.id}: site introuvable pour idUsine=${row.idUsine}`
      );
      result.skipped++;
      continue;
    }

    if (!physicalPath) {
      result.errors.push(
        `ronde #${row.id}: fichier '${filename}' introuvable dans le dossier source`
      );
      result.skipped++;
      continue;
    }

    const newUrl = copyFileToUploads(
      physicalPath,
      "rondes",
      site.localisation,
      row.dateHeureCreation
    );

    if (!dryRun) {
      await dataSource.query("UPDATE ronde SET urlPDF = @0 WHERE Id = @1", [
        newUrl,
        row.id,
      ]);
    }

    console.log(`    ✓ ronde #${row.id}: ${row.urlPDF} → ${newUrl}`);
    result.migrated++;
  }

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Migration /fichier/ → /uploads/");
  console.log(`  Env: ${nodeEnv}`);
  console.log(`  Source: ${sourceDir}`);
  console.log(`  Destination: ${uploadsDir}`);
  if (dryRun) {
    console.log("  ⚠  MODE DRY-RUN — aucune modification ne sera effectuée");
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Vérifier que le dossier source existe
  if (!existsSync(sourceDir!)) {
    console.error(`Erreur: le dossier source '${sourceDir}' n'existe pas.`);
    process.exit(1);
  }

  // 2. Indexer les fichiers physiques
  console.log("Indexation des fichiers source...");
  const fileIndex = buildFileIndex(sourceDir!);
  console.log(`  ${fileIndex.size} fichiers trouvés\n`);

  // 3. Connexion à la BDD
  console.log("Connexion à la base de données...");
  await dataSource.initialize();
  console.log("  Connecté\n");

  try {
    // 4. Charger les sites
    console.log("Chargement des sites...");
    const sites = await loadSites();
    console.log(`  ${sites.size} sites trouvés\n`);

    // 5. Créer les dossiers de destination
    for (const subDir of [
      "consignes",
      "quart-evenements",
      "mode-operatoire",
      "anomalies",
      "rondes",
    ]) {
      ensureDir(join(uploadsDir, subDir));
    }

    // 6. Migrer chaque table
    console.log("Migration des fichiers :\n");
    const results: MigrationResult[] = [];

    results.push(await migrateConsignes(fileIndex, sites));
    console.log("");
    results.push(await migrateQuartEvenements(fileIndex, sites));
    console.log("");
    results.push(await migrateModeOperatoire(fileIndex, sites));
    console.log("");
    results.push(await migrateAnomalies(fileIndex, sites));
    console.log("");
    results.push(await migrateRondes(fileIndex, sites));

    // 7. Rapport
    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("  RAPPORT DE MIGRATION");
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const r of results) {
      console.log(
        `  ${r.table.padEnd(20)} : ${r.migrated}/${r.total} migrés, ${r.skipped} ignorés`
      );
      totalMigrated += r.migrated;
      totalSkipped += r.skipped;
      totalErrors += r.errors.length;

      if (r.errors.length > 0) {
        for (const err of r.errors) {
          console.log(`    ⚠ ${err}`);
        }
      }
    }

    console.log(
      `\n  TOTAL: ${totalMigrated} migrés, ${totalSkipped} ignorés, ${totalErrors} erreurs`
    );

    if (dryRun) {
      console.log(
        "\n  ⚠  DRY-RUN — Relancez sans --dry-run pour appliquer les changements"
      );
    }
  } finally {
    await dataSource.destroy();
    console.log("\nConnexion fermée.");
  }
}

main().catch(err => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
