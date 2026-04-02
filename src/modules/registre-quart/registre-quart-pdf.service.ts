import { Injectable } from "@nestjs/common";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as PDFDocument from "pdfkit";

import { LoggerService } from "@/common/services/logger.service";

import { RegistreQuartData } from "./registre-quart.service";

@Injectable()
export class RegistreQuartPdfService {
  private readonly uploadsPath = join(
    process.cwd(),
    "uploads",
    "registre-quart"
  );
  private readonly logoPath = join(process.cwd(), "assets", "paprec.png");

  constructor(private readonly logger: LoggerService) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!existsSync(this.uploadsPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  async generatePdf(data: RegistreQuartData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      this.buildDocument(doc, data);

      doc.end();
    });
  }

  async generateAndSave(
    data: RegistreQuartData,
    siteName: string
  ): Promise<{ buffer: Buffer; filePath: string; url: string }> {
    const buffer = await this.generatePdf(data);

    const safeDate = data.date.replace(/\//g, "-");
    const safeSite = siteName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `registre_${safeSite}_${safeDate}_Q${data.quart}.pdf`;
    const siteDir = join(this.uploadsPath, safeSite);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!existsSync(siteDir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      mkdirSync(siteDir, { recursive: true });
    }

    const filePath = join(siteDir, filename);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(filePath, buffer);

    this.logger.log(
      `Registre de quart PDF généré: ${filename}`,
      "RegistreQuartPdfService"
    );

    return {
      buffer,
      filePath,
      url: `/uploads/registre-quart/${safeSite}/${filename}`,
    };
  }

  private buildDocument(
    doc: PDFKit.PDFDocument,
    data: RegistreQuartData
  ): void {
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // --- Header ---
    this.drawHeader(doc, data, pageWidth);

    // --- Equipe table ---
    this.drawEquipeTable(doc, data, pageWidth);

    // Info text
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor("#2e8b57")
      .text(
        'Pour faire remonter une zone, veuiller ajouter " - PDF" à la fin du nom de zone',
        doc.page.margins.left,
        doc.y
      );
    doc.fillColor("#000000");

    // --- Consignes ---
    this.drawSection(doc, "Consignes :", pageWidth);
    if (data.consignes.length === 0) {
      doc.fontSize(9).text("Aucune consigne", { indent: 20 });
    } else {
      for (const c of data.consignes) {
        this.checkPageBreak(doc, 30);
        doc.fontSize(9).text(`• ${c.titre} - ${c.commentaire}`, {
          indent: 20,
          width: pageWidth - 40,
        });
        doc.moveDown(0.3);
      }
    }

    // --- Actions ---
    this.drawSection(doc, "Actions :", pageWidth);
    if (data.actions.length === 0) {
      doc.fontSize(9).text("Aucune action", { indent: 20 });
    } else {
      for (const a of data.actions) {
        this.checkPageBreak(doc, 20);
        const label = a.heure ? `${a.heure} ${a.nom}` : a.nom;
        doc
          .fontSize(9)
          .text(`• ${label}`, { indent: 20, width: pageWidth - 40 });
        doc.moveDown(0.3);
      }
    }

    // --- Evenements ---
    this.drawSection(doc, "Evenements :", pageWidth);
    if (data.evenements.length === 0) {
      doc.fontSize(9).text("Aucun événement", { indent: 20 });
    } else {
      for (const e of data.evenements) {
        this.checkPageBreak(doc, 30);
        doc
          .fontSize(9)
          .text(
            `• ${e.dateHeure} : ${e.titre} - ${e.description} (Cause: ${e.cause} - /)`,
            { indent: 20, width: pageWidth - 40 }
          );
        doc.moveDown(0.3);
      }
    }

    // --- Zones contrôlées ---
    this.drawSection(doc, "Zones contrôlées :", pageWidth);
    if (data.zones.length === 0) {
      doc.fontSize(9).text("Aucune zone contrôlée", { indent: 20 });
    } else {
      for (const z of data.zones) {
        this.checkPageBreak(doc, 20);
        const status = z.termine ? "Terminé" : "En cours";
        const by = z.controlePar ? ` par : ${z.controlePar}` : "";
        doc.fontSize(9).text(`• ${z.nom} - Contrôlée${by} (${status})`, {
          indent: 20,
          width: pageWidth - 40,
        });
        doc.moveDown(0.3);
      }
    }

    // --- Actualités ---
    this.drawSection(doc, "Actualités :", pageWidth);
    if (data.actualites.length === 0) {
      doc.fontSize(9).text("Aucune actualité", { indent: 20 });
    } else {
      for (const a of data.actualites) {
        this.checkPageBreak(doc, 30);
        doc.fontSize(9).text(`• ${a.titre} - ${a.description}`, {
          indent: 20,
          width: pageWidth - 40,
        });
        doc.moveDown(0.3);
      }
    }

    // --- Separator ---
    doc.moveDown(0.5);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke("#999999");
    doc.moveDown(0.5);

    // --- Anomalies ---
    this.drawSection(doc, "Anomalies :", pageWidth);
    if (data.anomalies.length === 0) {
      doc.fontSize(9).text("", { indent: 20 });
    } else {
      for (const a of data.anomalies) {
        this.checkPageBreak(doc, 20);
        doc.fontSize(9).text(`• ${a.commentaire}`, {
          indent: 20,
          width: pageWidth - 40,
        });
        doc.moveDown(0.3);
      }
    }

    // --- Signatures ---
    this.checkPageBreak(doc, 120);
    doc.moveDown(2);
    const sigY = doc.y;
    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + pageWidth / 2 + 40;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`CDQ SORTANT : ${data.cdqSortant}`, leftX, sigY);
    doc.text(`CDQ ENTRANT : ${data.cdqEntrant}`, rightX, sigY);
    doc.font("Helvetica");
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    data: RegistreQuartData,
    pageWidth: number
  ): void {
    const startY = doc.y;

    // Logo
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (existsSync(this.logoPath)) {
      doc.image(this.logoPath, doc.page.margins.left, startY, {
        width: 100,
      });
    }

    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Registre de quart :", doc.page.margins.left + 120, startY);
    doc
      .fontSize(16)
      .text(data.siteName, doc.page.margins.left + 120, startY + 22);

    // Date info (right side)
    const rightX = doc.page.margins.left + pageWidth - 180;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Date: ${data.date}`, rightX, startY);

    // Determine shift start hour for the date display
    doc.text(`Quart: ${data.quartLabel}`, rightX, startY + 14);

    doc.y = startY + 60;
    doc.moveDown(0.5);
  }

  private drawEquipeTable(
    doc: PDFKit.PDFDocument,
    data: RegistreQuartData,
    pageWidth: number
  ): void {
    const colWidths = [
      pageWidth * 0.2, // Poste
      pageWidth * 0.25, // Nom/Prénom
      pageWidth * 0.15, // Heure Début
      pageWidth * 0.15, // Heure Fin
      pageWidth * 0.25, // Travaux pénible
    ];

    const headers = [
      "Poste",
      "Nom / Prénom",
      "Heure Début",
      "Heure Fin",
      "Travaux pénible",
    ];

    const startX = doc.page.margins.left;
    let y = doc.y;
    const rowHeight = 22;

    // Header row
    doc.fontSize(9).font("Helvetica-Bold");
    let x = startX;

    // Header background
    doc
      .rect(startX, y, pageWidth, rowHeight)
      .fillAndStroke("#f0f0f0", "#cccccc");

    doc.fillColor("#000000");

    const headerCells = headers.map((h, i) => ({
      text: h,
      width: colWidths.at(i) ?? 0,
    }));
    for (const cell of headerCells) {
      doc.text(cell.text, x + 4, y + 6, {
        width: cell.width - 8,
        align: "center",
      });
      x += cell.width;
    }
    y += rowHeight;

    // Data rows
    doc.font("Helvetica").fontSize(9);
    for (const aff of data.affectations) {
      const cells = [
        { value: aff.poste, width: colWidths.at(0) ?? 0 },
        { value: aff.nomPrenom, width: colWidths.at(1) ?? 0 },
        { value: aff.heureDebut, width: colWidths.at(2) ?? 0 },
        { value: aff.heureFin, width: colWidths.at(3) ?? 0 },
        { value: aff.travauxPenible, width: colWidths.at(4) ?? 0 },
      ];

      // Row border
      doc.rect(startX, y, pageWidth, rowHeight).stroke("#cccccc");

      x = startX;
      for (const [ci, cell] of cells.entries()) {
        // Column separator
        if (ci > 0) {
          doc
            .moveTo(x, y)
            .lineTo(x, y + rowHeight)
            .stroke("#cccccc");
        }
        doc.fillColor("#000000").text(cell.value, x + 4, y + 6, {
          width: (cell.width ?? 0) - 8,
          align: "center",
        });
        x += cell.width ?? 0;
      }
      y += rowHeight;
    }

    doc.y = y + 5;
  }

  private drawSection(
    doc: PDFKit.PDFDocument,
    title: string,
    _pageWidth: number
  ): void {
    this.checkPageBreak(doc, 40);
    doc.moveDown(0.8);
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#2e8b57").text(title);
    doc.fillColor("#000000").font("Helvetica");
    doc.moveDown(0.3);
  }

  private checkPageBreak(doc: PDFKit.PDFDocument, neededSpace: number): void {
    const bottomMargin = doc.page.margins.bottom;
    const pageHeight = doc.page.height;
    if (doc.y + neededSpace > pageHeight - bottomMargin) {
      doc.addPage();
    }
  }
}
