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

// Project PDF Export
interface ProjectData {
  name: string;
  project_type: string | null;
  status: string | null;
  progress: number | null;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  completion_date: string | null;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  system?: { name: string } | null;
  manager?: { full_name: string } | null;
  approver?: { full_name: string } | null;
}

const projectTypeLabels: Record<string, string> = {
  initial_validation: "Validação Inicial",
  revalidation: "Revalidação",
  change_control: "Controle de Mudanças",
  periodic_review: "Revisão Periódica",
};

export function exportProjectToPDF(project: ProjectData): void {
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

  // Header
  pdf.setFillColor(16, 185, 129); // Green color
  pdf.rect(0, 0, pageWidth, 40, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("RELATÓRIO DE PROJETO DE VALIDAÇÃO", margin, 15);
  
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(project.name, contentWidth);
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, margin, 26 + index * 7);
  });

  yPosition = 50;
  pdf.setTextColor(0, 0, 0);

  // Status and Progress Section
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPosition, contentWidth, 30, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, yPosition, contentWidth, 30, "S");

  yPosition += 10;
  pdf.setFontSize(10);

  // Status Badge
  const status = statusLabels[project.status || "draft"] || project.status || "Rascunho";
  pdf.setFont("helvetica", "bold");
  pdf.text("Status:", margin + 5, yPosition);
  
  // Status color
  const statusColors: Record<string, number[]> = {
    draft: [156, 163, 175],
    pending: [234, 179, 8],
    approved: [34, 197, 94],
    rejected: [239, 68, 68],
    completed: [16, 185, 129],
  };
  const statusColor = statusColors[project.status || "draft"] || [156, 163, 175];
  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.roundedRect(margin + 22, yPosition - 4, 35, 6, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text(status, margin + 24, yPosition);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);

  // Progress Bar
  pdf.setFont("helvetica", "bold");
  pdf.text("Progresso:", margin + 70, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${project.progress || 0}%`, margin + 95, yPosition);
  
  // Progress bar visual
  const barWidth = 50;
  const barHeight = 4;
  const progressWidth = (barWidth * (project.progress || 0)) / 100;
  pdf.setFillColor(226, 232, 240);
  pdf.rect(margin + 110, yPosition - 3, barWidth, barHeight, "F");
  pdf.setFillColor(16, 185, 129);
  pdf.rect(margin + 110, yPosition - 3, progressWidth, barHeight, "F");

  yPosition += 12;

  // Type
  pdf.setFont("helvetica", "bold");
  pdf.text("Tipo:", margin + 5, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(projectTypeLabels[project.project_type || ""] || project.project_type || "-", margin + 22, yPosition);

  yPosition += 20;

  // Schedule Section
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cronograma", margin, yPosition);
  yPosition += 3;
  pdf.setDrawColor(16, 185, 129);
  pdf.setLineWidth(0.8);
  pdf.line(margin, yPosition, margin + 35, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  
  // Timeline visual
  const timelineY = yPosition;
  const circleRadius = 3;
  const lineStartX = margin + 10;
  
  // Start Date
  pdf.setFillColor(16, 185, 129);
  pdf.circle(lineStartX, timelineY, circleRadius, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Início", lineStartX + 8, timelineY + 1);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    project.start_date ? new Date(project.start_date).toLocaleDateString("pt-BR") : "Não definido",
    lineStartX + 8,
    timelineY + 6
  );

  // Line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(lineStartX + 40, timelineY, lineStartX + 70, timelineY);

  // Target Date
  pdf.setFillColor(234, 179, 8);
  pdf.circle(lineStartX + 80, timelineY, circleRadius, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Meta", lineStartX + 88, timelineY + 1);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    project.target_date ? new Date(project.target_date).toLocaleDateString("pt-BR") : "Não definido",
    lineStartX + 88,
    timelineY + 6
  );

  // Line
  pdf.line(lineStartX + 120, timelineY, lineStartX + 130, timelineY);

  // Completion Date
  const isCompleted = !!project.completion_date;
  pdf.setFillColor(isCompleted ? 16 : 200, isCompleted ? 185 : 200, isCompleted ? 129 : 200);
  pdf.circle(lineStartX + 140, timelineY, circleRadius, isCompleted ? "F" : "S");
  pdf.setFont("helvetica", "bold");
  pdf.text("Conclusão", lineStartX + 148, timelineY + 1);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    project.completion_date ? new Date(project.completion_date).toLocaleDateString("pt-BR") : "Pendente",
    lineStartX + 148,
    timelineY + 6
  );

  yPosition = timelineY + 20;

  // Team Section
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Equipe", margin, yPosition);
  yPosition += 3;
  pdf.setDrawColor(16, 185, 129);
  pdf.line(margin, yPosition, margin + 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  
  // Manager
  pdf.setFillColor(240, 240, 240);
  pdf.roundedRect(margin, yPosition - 4, 75, 16, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Gerente", margin + 5, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(project.manager?.full_name || "Não atribuído", margin + 5, yPosition + 7);

  // System
  pdf.setFillColor(240, 240, 240);
  pdf.roundedRect(margin + 85, yPosition - 4, 75, 16, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Sistema", margin + 90, yPosition);
  pdf.setFont("helvetica", "normal");
  pdf.text(project.system?.name || "-", margin + 90, yPosition + 7);

  yPosition += 25;

  // Approval Section
  if (project.approved_at || project.rejection_reason) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Aprovação", margin, yPosition);
    yPosition += 3;
    pdf.setDrawColor(16, 185, 129);
    pdf.line(margin, yPosition, margin + 30, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    
    if (project.approved_at && project.approver) {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin, yPosition - 4, contentWidth, 16, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.text("Aprovado por:", margin + 5, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(project.approver.full_name, margin + 40, yPosition);
      pdf.text(
        `em ${new Date(project.approved_at).toLocaleDateString("pt-BR")}`,
        margin + 5,
        yPosition + 7
      );
      yPosition += 20;
    }

    if (project.rejection_reason) {
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(margin, yPosition - 4, contentWidth, 20, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(185, 28, 28);
      pdf.text("Motivo da Rejeição:", margin + 5, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      const reasonLines = pdf.splitTextToSize(project.rejection_reason, contentWidth - 10);
      reasonLines.slice(0, 2).forEach((line: string, i: number) => {
        pdf.text(line, margin + 5, yPosition + 6 + i * 5);
      });
      yPosition += 25;
    }
  }

  // Description
  if (project.description) {
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Descrição", margin, yPosition);
    yPosition += 3;
    pdf.setDrawColor(16, 185, 129);
    pdf.line(margin, yPosition, margin + 28, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const descLines = pdf.splitTextToSize(project.description, contentWidth);
    descLines.forEach((line: string, index: number) => {
      if (yPosition + index * 5 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition + index * 5);
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Relatório gerado automaticamente - Página ${i} de ${totalPages}`,
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

  // Filename
  const safeName = project.name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
  const filename = `Projeto_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  pdf.save(filename);
}
