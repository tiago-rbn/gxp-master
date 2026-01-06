import jsPDF from "jspdf";

interface DocumentData {
  title: string;
  document_type: string;
  version: string | null;
  status: string | null;
  content: string | null;
  created_at: string;
  approved_at: string | null;
  system?: { name: string } | null;
  author?: { full_name: string } | null;
  approver?: { full_name: string } | null;
}

const documentTypeLabels: Record<string, string> = {
  URS: "User Requirements Specification",
  FS: "Functional Specification",
  DS: "Design Specification",
  IQ: "Installation Qualification",
  OQ: "Operational Qualification",
  PQ: "Performance Qualification",
  RTM: "Requirements Traceability Matrix",
  Report: "Relatório de Validação",
  PV: "Plano de Validação",
  RA: "Análise de Riscos",
  SOP: "Procedimento Operacional Padrão",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em Revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function exportDocumentToPDF(document: DocumentData): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number => {
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, index: number) => {
      if (y + index * lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, x, y + index * lineHeight);
    });
    return y + lines.length * lineHeight;
  };

  // Header with document type
  pdf.setFillColor(59, 130, 246); // Blue color
  pdf.rect(0, 0, pageWidth, 35, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(document.document_type, margin, 15);
  
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(documentTypeLabels[document.document_type] || document.document_type, margin, 22);

  // Title
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(document.title, contentWidth);
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, margin, 30 + index * 6);
  });

  yPosition = 45;
  pdf.setTextColor(0, 0, 0);

  // Metadata section
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPosition, contentWidth, 35, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, yPosition, contentWidth, 35, "S");

  yPosition += 8;
  pdf.setFontSize(9);
  
  // Row 1: Version, Status, System
  pdf.setFont("helvetica", "bold");
  pdf.text("Versão:", margin + 5, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(`v${document.version || "1.0"}`, margin + 25, yPosition);

  pdf.setFont("helvetica", "bold");
  pdf.text("Status:", margin + 50, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(statusLabels[document.status || "draft"] || document.status || "Rascunho", margin + 70, yPosition);

  pdf.setFont("helvetica", "bold");
  pdf.text("Sistema:", margin + 110, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(document.system?.name || "-", margin + 130, yPosition);

  yPosition += 10;

  // Row 2: Author, Created
  pdf.setFont("helvetica", "bold");
  pdf.text("Autor:", margin + 5, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(document.author?.full_name || "-", margin + 25, yPosition);

  pdf.setFont("helvetica", "bold");
  pdf.text("Criado em:", margin + 80, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(new Date(document.created_at).toLocaleDateString("pt-BR"), margin + 110, yPosition);

  if (document.approved_at) {
    yPosition += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Aprovado por:", margin + 5, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(document.approver?.full_name || "-", margin + 35, yPosition);

    pdf.setFont("helvetica", "bold");
    pdf.text("Aprovado em:", margin + 80, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(new Date(document.approved_at).toLocaleDateString("pt-BR"), margin + 115, yPosition);
  }

  yPosition += 20;

  // Content section
  if (document.content) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Conteúdo", margin, yPosition);
    yPosition += 8;

    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, margin + 30, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    // Process content - handle markdown-like formatting
    const contentLines = document.content.split("\n");
    
    contentLines.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // Handle headers
      if (line.startsWith("# ")) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        yPosition = addWrappedText(line.substring(2), margin, yPosition, contentWidth, 7);
        yPosition += 4;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
      } else if (line.startsWith("## ")) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        yPosition = addWrappedText(line.substring(3), margin, yPosition, contentWidth, 6);
        yPosition += 3;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
      } else if (line.startsWith("### ")) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        yPosition = addWrappedText(line.substring(4), margin, yPosition, contentWidth, 6);
        yPosition += 2;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        // Bullet points
        pdf.text("•", margin, yPosition);
        yPosition = addWrappedText(line.substring(2), margin + 5, yPosition, contentWidth - 5, 5);
      } else if (line.match(/^\d+\. /)) {
        // Numbered lists
        const match = line.match(/^(\d+)\. (.*)$/);
        if (match) {
          pdf.text(`${match[1]}.`, margin, yPosition);
          yPosition = addWrappedText(match[2], margin + 8, yPosition, contentWidth - 8, 5);
        }
      } else if (line.trim() === "") {
        yPosition += 4;
      } else {
        yPosition = addWrappedText(line, margin, yPosition, contentWidth, 5);
      }
    });
  }

  // Footer on last page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Documento gerado automaticamente - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    pdf.text(
      new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Generate filename
  const safeTitle = document.title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
  const filename = `${document.document_type}_${safeTitle}_v${document.version || "1.0"}.pdf`;

  pdf.save(filename);
}
