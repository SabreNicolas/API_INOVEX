import { Injectable } from "@nestjs/common";
import * as PDFDocument from "pdfkit";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";

interface ZoneWithGroupementsAndElements extends ZoneControle {
  groupements: (Groupement & { elements: ElementControle[] })[];
  elementsWithoutGroupement: ElementControle[];
}

@Injectable()
export class PdfGeneratorService {
  constructor(private readonly logger: LoggerService) {}

  generateRepriseRondePdf(
    zones: ZoneWithGroupementsAndElements[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 30, bottom: 30, left: 30, right: 30 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Title
        doc.fontSize(18).font("Helvetica-Bold").text("Ronde du : ", {
          align: "center",
        });
        doc.moveDown(1);

        // Table configuration
        const tableLeft = 30;
        const colWidths = [170, 110, 110, 110]; // 31%, 23%, 23%, 23% of ~500px
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 25;
        const headerHeight = 20;

        let yPosition = doc.y;

        // Draw table header
        this.drawTableHeader(
          doc,
          tableLeft,
          yPosition,
          colWidths,
          headerHeight
        );
        yPosition += headerHeight;

        // Draw fixed rows (Auteur de la ronde, Chef de quart, Fours)
        const fixedRows = [
          "Auteur de la ronde",
          "Chef de quart",
          "Four 1 en fonctionnement ?",
          "Four 2 en fonctionnement ?",
        ];

        for (const rowText of fixedRows) {
          yPosition = this.checkPageBreak(doc, yPosition, rowHeight);
          this.drawDataRow(
            doc,
            tableLeft,
            yPosition,
            colWidths,
            rowHeight,
            rowText
          );
          yPosition += rowHeight;
        }

        // Draw zones with groupements and elements
        for (const zone of zones) {
          // Zone header
          yPosition = this.checkPageBreak(doc, yPosition, rowHeight);
          this.drawZoneHeader(
            doc,
            tableLeft,
            yPosition,
            tableWidth,
            rowHeight,
            zone.nom || "Zone sans nom"
          );
          yPosition += rowHeight;

          // Elements without groupement first
          for (const element of zone.elementsWithoutGroupement) {
            yPosition = this.checkPageBreak(doc, yPosition, rowHeight * 2);
            yPosition = this.drawElementRow(
              doc,
              tableLeft,
              yPosition,
              colWidths,
              element
            );
          }

          // Groupements with their elements
          for (const groupement of zone.groupements) {
            if (groupement.elements.length === 0) continue;

            // Groupement header
            yPosition = this.checkPageBreak(doc, yPosition, rowHeight);
            this.drawGroupementHeader(
              doc,
              tableLeft,
              yPosition,
              tableWidth,
              rowHeight,
              groupement.groupement
            );
            yPosition += rowHeight;

            // Elements of the groupement
            for (const element of groupement.elements) {
              yPosition = this.checkPageBreak(doc, yPosition, rowHeight * 2);
              yPosition = this.drawElementRow(
                doc,
                tableLeft,
                yPosition,
                colWidths,
                element
              );
            }
          }
        }

        doc.end();
      } catch (error) {
        this.logger.error(
          "Erreur lors de la génération du PDF",
          error instanceof Error ? error.stack : String(error),
          "PdfGeneratorService"
        );
        reject(error);
      }
    });
  }

  private checkPageBreak(
    doc: PDFKit.PDFDocument,
    yPosition: number,
    neededHeight: number
  ): number {
    const pageHeight = doc.page.height - doc.page.margins.bottom;
    if (yPosition + neededHeight > pageHeight) {
      doc.addPage();
      return doc.page.margins.top;
    }
    return yPosition;
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidths: number[],
    height: number
  ): void {
    const headers = ["Élément de contrôle", "Matin", "Après-midi", "Nuit"];

    let currentX = x;
    for (let i = 0; i < headers.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const colWidth = colWidths[i];
      // Draw cell background
      doc.rect(currentX, y, colWidth, height).fill("#dddddd");

      // Draw cell border
      doc.rect(currentX, y, colWidth, height).stroke();

      // Draw text
      doc
        .fillColor("black")
        .fontSize(8)
        .font("Helvetica-Bold")
        // eslint-disable-next-line security/detect-object-injection
        .text(headers[i], currentX + 3, y + 5, {
          width: colWidth - 6,
          align: "center",
        });

      currentX += colWidth;
    }
  }

  private drawDataRow(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidths: number[],
    height: number,
    text: string
  ): void {
    let currentX = x;
    for (let i = 0; i < colWidths.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const colWidth = colWidths[i];
      doc.rect(currentX, y, colWidth, height).stroke();

      if (i === 0) {
        doc
          .fillColor("black")
          .fontSize(8)
          .font("Helvetica")
          .text(text, currentX + 3, y + 8, {
            width: colWidth - 6,
          });
      }

      currentX += colWidth;
    }
  }

  private drawZoneHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string
  ): void {
    doc.rect(x, y, width, height).stroke();
    doc
      .fillColor("#007FFF")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(text, x, y + 8, {
        width: width,
        align: "center",
      });
    doc.fillColor("black");
  }

  private drawGroupementHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string
  ): void {
    doc.rect(x, y, width, height).stroke();
    doc
      .fillColor("#FF7F50")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(text, x + 5, y + 8, {
        width: width - 10,
        align: "left",
      });
    doc.fillColor("black");
  }

  private drawElementRow(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidths: number[],
    element: ElementControle
  ): number {
    const listValues = element.listValues
      ? element.listValues.replace(/ /g, " / ")
      : "";
    const minHeight = 40;

    // First column - Element info
    let currentX = x;
    doc.rect(currentX, y, colWidths[0], minHeight).stroke();

    let textY = y + 5;
    doc.fontSize(8).font("Helvetica").fillColor("black");
    doc.text(element.nom || "", currentX + 3, textY, {
      width: colWidths[0] - 6,
    });
    textY += 12;

    doc.fillColor("red");
    doc.text(`unit : ${element.unit || ""}`, currentX + 3, textY, {
      width: colWidths[0] - 6,
    });
    textY += 10;

    doc.fillColor("blue");
    doc.text(
      `bornes : ${element.valeurMin ?? ""} - ${element.valeurMax ?? ""}`,
      currentX + 3,
      textY,
      { width: colWidths[0] - 6 }
    );

    doc.fillColor("black");
    currentX += colWidths[0];

    // Other columns - list values
    for (let i = 1; i < colWidths.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const colWidth = colWidths[i];
      doc.rect(currentX, y, colWidth, minHeight).stroke();
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(listValues, currentX + 3, y + 15, {
          width: colWidth - 6,
          align: "center",
        });
      currentX += colWidth;
    }

    return y + minHeight;
  }
}
