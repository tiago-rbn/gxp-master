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

interface ExportOptions {
  companyLogo?: string | null;
  companyName?: string | null;
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

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportDocumentToPDF(document: DocumentData, options?: ExportOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Load company logo if provided
  let logoBase64: string | null = null;
  if (options?.companyLogo) {
    logoBase64 = await loadImageAsBase64(options.companyLogo);
  }

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
  pdf.rect(0, 0, pageWidth, 40, "F");
  
  // Add company logo if available
  let textStartX = margin;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'AUTO', margin, 5, 30, 30);
      textStartX = margin + 35;
    } catch (e) {
      console.warn('Failed to add logo to PDF:', e);
    }
  }
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(document.document_type, textStartX, 15);
  
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(documentTypeLabels[document.document_type] || document.document_type, textStartX, 22);

  // Company name if available
  if (options?.companyName) {
    pdf.setFontSize(8);
    pdf.text(options.companyName, pageWidth - margin, 10, { align: "right" });
  }

  // Title
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(document.title, contentWidth - (logoBase64 ? 35 : 0));
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, textStartX, 32 + index * 6);
  });

  yPosition = 50;
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

export async function exportProjectToPDF(project: ProjectData, options?: ExportOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Load company logo if provided
  let logoBase64: string | null = null;
  if (options?.companyLogo) {
    logoBase64 = await loadImageAsBase64(options.companyLogo);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header
  pdf.setFillColor(16, 185, 129); // Green color
  pdf.rect(0, 0, pageWidth, 45, "F");
  
  // Add company logo if available
  let textStartX = margin;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'AUTO', margin, 5, 35, 35);
      textStartX = margin + 40;
    } catch (e) {
      console.warn('Failed to add logo to PDF:', e);
    }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("RELATÓRIO DE PROJETO DE VALIDAÇÃO", textStartX, 15);

  // Company name if available
  if (options?.companyName) {
    pdf.setFontSize(8);
    pdf.text(options.companyName, pageWidth - margin, 10, { align: "right" });
  }
  
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(project.name, contentWidth - (logoBase64 ? 40 : 0));
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, textStartX, 26 + index * 7);
  });

  yPosition = 55;
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

// Systems Inventory PDF Export
const gampLabels: Record<string, string> = {
  "1": "Cat. 1 - Infraestrutura",
  "3": "Cat. 3 - COTS",
  "4": "Cat. 4 - Configurado",
  "5": "Cat. 5 - Customizado",
};

const criticalityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const validationStatusLabelsInv: Record<string, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  validated: "Validado",
  expired: "Expirado",
  pending_revalidation: "Revalidação Pendente",
};

const usageStatusLabelsInv: Record<string, string> = {
  deploying: "Em Implantação",
  in_use: "Em Uso",
  retired: "Aposentado",
};

export function exportSystemsInventoryToPDF(systems: any[], options?: { companyName?: string | null; userName?: string | null }): void {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Header
  pdf.setFillColor(30, 64, 175);
  pdf.rect(0, 0, pageWidth, 25, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Inventário de Sistemas Computadorizados", margin, 12);
  
  // Company name in header
  if (options?.companyName) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(options.companyName, margin, 20);
  }
  
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth - margin, 10, { align: "right" });
  pdf.text(`Total: ${systems.length} sistema(s)`, pageWidth - margin, 16, { align: "right" });

  // Table header
  let y = 32;
  const colWidths = [50, 35, 35, 25, 30, 35, 30, 28];
  const headers = ["Sistema", "Fornecedor", "GAMP", "Criticidade", "Status Uso", "Status Validação", "GxP", "Interfaces"];

  const drawTableHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, pageWidth - margin * 2, 8, "F");
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    let x = margin + 2;
    headers.forEach((h, i) => {
      pdf.text(h, x, y + 5.5);
      x += colWidths[i];
    });
    y += 10;
  };

  drawTableHeader();

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");

  systems.forEach((system) => {
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 15;
      drawTableHeader();
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
    }

    let x = margin + 2;
    const row = [
      system.name?.substring(0, 25) || "-",
      system.vendor?.substring(0, 18) || "-",
      gampLabels[system.gamp_category] || system.gamp_category,
      criticalityLabels[system.criticality || "medium"],
      usageStatusLabelsInv[system.usage_status || "in_use"],
      validationStatusLabelsInv[system.validation_status || "not_started"],
      system.gxp_impact ? "Sim" : "Não",
      system.has_interfaces ? "Sim" : "Não",
    ];

    row.forEach((cell, i) => {
      pdf.text(cell, x, y + 4);
      x += colWidths[i];
    });

    // Row border
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y + 7, pageWidth - margin, y + 7);
    y += 8;
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    
    const footerLeft = options?.userName 
      ? `Gerado por: ${options.userName}` 
      : "Documento gerado automaticamente";
    pdf.text(footerLeft, margin, pageHeight - 8);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  pdf.save(`Inventario_Sistemas_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Risk Assessment PDF Export (grouped by system)
interface RiskAssessmentData {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  assessment_type: string;
  probability?: number | null;
  severity?: number | null;
  detectability?: number | null;
  risk_level?: string | null;
  residual_risk?: string | null;
  controls?: string | null;
  status?: string | null;
  version?: string | null;
  tags?: string[] | null;
  created_at: string;
  system?: { name: string } | null;
  assessor?: { full_name: string } | null;
  approver?: { full_name: string } | null;
  reviewer?: { full_name: string } | null;
}

const riskLevelLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

const riskLevelColors: Record<string, number[]> = {
  low: [34, 197, 94],
  medium: [234, 179, 8],
  high: [239, 68, 68],
  critical: [153, 27, 27],
};

export async function exportRiskAssessmentPDF(
  risks: RiskAssessmentData[],
  systemName?: string,
  options?: ExportOptions
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  let logoBase64: string | null = null;
  if (options?.companyLogo) {
    logoBase64 = await loadImageAsBase64(options.companyLogo);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Group risks by system
  const grouped = new Map<string, { name: string; risks: RiskAssessmentData[] }>();
  const targetRisks = systemName
    ? risks.filter((r) => r.system?.name === systemName)
    : risks;

  targetRisks.forEach((risk) => {
    const key = risk.system?.name || "Sem Sistema";
    if (!grouped.has(key)) {
      grouped.set(key, { name: key, risks: [] });
    }
    grouped.get(key)!.risks.push(risk);
  });

  let isFirstPage = true;

  for (const [, group] of grouped) {
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    let y = margin;

    // ─── COVER / HEADER ───
    pdf.setFillColor(153, 27, 27);
    pdf.rect(0, 0, pageWidth, 30, "F");

    let textStartX = margin;
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, "AUTO", margin, 3, 24, 24);
        textStartX = margin + 28;
      } catch { /* ignore */ }
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("RELATÓRIO DE AVALIAÇÃO DE RISCOS FUNCIONAIS — GAMP5", textStartX, 11);

    if (options?.companyName) {
      pdf.setFontSize(8);
      pdf.text(options.companyName, pageWidth - margin, 8, { align: "right" });
    }

    pdf.setFontSize(15);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Sistema: ${group.name}`, textStartX, 22);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth - margin,
      16,
      { align: "right" }
    );
    pdf.text(`Total: ${group.risks.length} risco(s)`, pageWidth - margin, 22, {
      align: "right",
    });

    y = 36;

    // ─── SUMMARY CARDS ───
    const highCount = group.risks.filter(
      (r) => r.risk_level === "high" || r.risk_level === "critical"
    ).length;
    const mediumCount = group.risks.filter((r) => r.risk_level === "medium").length;
    const lowCount = group.risks.filter((r) => r.risk_level === "low").length;

    const cardW = 40;
    const cardH = 14;
    const cardGap = 5;
    const cardsStartX = margin;

    // Critical/High
    pdf.setFillColor(254, 226, 226);
    pdf.roundedRect(cardsStartX, y, cardW, cardH, 2, 2, "F");
    pdf.setTextColor(153, 27, 27);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(highCount), cardsStartX + 5, y + 10);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Alto / Crítico", cardsStartX + 18, y + 10);

    // Medium
    pdf.setFillColor(254, 249, 195);
    pdf.roundedRect(cardsStartX + cardW + cardGap, y, cardW, cardH, 2, 2, "F");
    pdf.setTextColor(133, 77, 14);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(mediumCount), cardsStartX + cardW + cardGap + 5, y + 10);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Médio", cardsStartX + cardW + cardGap + 18, y + 10);

    // Low
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(cardsStartX + (cardW + cardGap) * 2, y, cardW, cardH, 2, 2, "F");
    pdf.setTextColor(22, 101, 52);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(lowCount), cardsStartX + (cardW + cardGap) * 2 + 5, y + 10);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Baixo", cardsStartX + (cardW + cardGap) * 2 + 18, y + 10);

    y += cardH + 6;

    // ─── RISK TABLE ───
    const colWidths = [28, 60, 18, 18, 18, 16, 22, 22, 50, 20];
    const headers = [
      "Código", "Título", "Sev.", "Prob.", "Det.", "RPN",
      "Nível", "Residual", "Controles", "Status",
    ];

    const drawTableHeader = () => {
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, contentWidth, 8, "F");
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(6.5);
      pdf.setFont("helvetica", "bold");
      let x = margin + 2;
      headers.forEach((h, i) => {
        pdf.text(h, x, y + 5.5);
        x += colWidths[i];
      });
      y += 10;
    };

    drawTableHeader();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);

    group.risks
      .sort((a, b) => {
        const rpnA = (a.probability || 1) * (a.severity || 1) * (a.detectability || 1);
        const rpnB = (b.probability || 1) * (b.severity || 1) * (b.detectability || 1);
        return rpnB - rpnA; // descending by RPN
      })
      .forEach((risk) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
          drawTableHeader();
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6.5);
        }

        const rpn =
          (risk.probability || 1) * (risk.severity || 1) * (risk.detectability || 1);
        const level = risk.risk_level || "medium";
        const residual = risk.residual_risk || "low";

        let x = margin + 2;
        pdf.setTextColor(0, 0, 0);

        const cells = [
          risk.code || "-",
          risk.title.substring(0, 35),
          String(risk.severity || "-"),
          String(risk.probability || "-"),
          String(risk.detectability || "-"),
          String(rpn),
        ];

        cells.forEach((cell, i) => {
          pdf.text(cell, x, y + 4);
          x += colWidths[i];
        });

        // Risk level badge
        const lvlColor = riskLevelColors[level] || [156, 163, 175];
        pdf.setFillColor(lvlColor[0], lvlColor[1], lvlColor[2]);
        pdf.roundedRect(x, y + 0.5, 18, 5, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(5.5);
        pdf.text(riskLevelLabels[level] || level, x + 2, y + 4);
        x += colWidths[6];

        // Residual risk badge
        const resColor = riskLevelColors[residual] || [156, 163, 175];
        pdf.setFillColor(resColor[0], resColor[1], resColor[2]);
        pdf.roundedRect(x, y + 0.5, 18, 5, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.text(riskLevelLabels[residual] || residual, x + 2, y + 4);
        x += colWidths[7];

        // Controls
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(6.5);
        pdf.text((risk.controls || "-").substring(0, 32), x, y + 4);
        x += colWidths[8];

        // Status
        pdf.text(statusLabels[risk.status || "draft"] || "-", x, y + 4);

        // Row border
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y + 7, pageWidth - margin, y + 7);
        y += 8;
      });

    // ─── 5×5 RISK MATRIX ───
    if (y + 55 > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }
    y += 5;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Matriz de Risco GAMP5 (5×5)", margin, y);
    y += 8;

    const cellSize = 9;
    const matrixX = margin + 12;
    const matrixY = y;

    // Draw cells
    for (let sev = 5; sev >= 1; sev--) {
      for (let prob = 1; prob <= 5; prob++) {
        const score = prob * sev;
        let fillR = 220, fillG = 252, fillB = 231; // green
        if (score >= 16) { fillR = 254; fillG = 226; fillB = 226; } // red
        else if (score >= 8) { fillR = 254; fillG = 249; fillB = 195; } // yellow

        const cx = matrixX + (prob - 1) * cellSize;
        const cy = matrixY + (5 - sev) * cellSize;

        pdf.setFillColor(fillR, fillG, fillB);
        pdf.rect(cx, cy, cellSize, cellSize, "F");
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(cx, cy, cellSize, cellSize, "S");

        // Check if any risk matches
        const hasRisk = group.risks.some(
          (r) => (r.probability || 0) === prob && (r.severity || 0) === sev
        );

        if (hasRisk) {
          pdf.setFillColor(0, 0, 0);
          pdf.circle(cx + cellSize / 2, cy + cellSize / 2, 2.5, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(5);
          const count = group.risks.filter(
            (r) => (r.probability || 0) === prob && (r.severity || 0) === sev
          ).length;
          pdf.text(String(count), cx + cellSize / 2 - 1.2, cy + cellSize / 2 + 1.5);
        } else {
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(5);
          pdf.text(String(score), cx + cellSize / 2 - 2, cy + cellSize / 2 + 1.5);
        }
      }
    }

    // Axis labels
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.text("Probabilidade →", matrixX + 5, matrixY + 5 * cellSize + 6);
    // Vertical label
    pdf.text("Impacto", matrixX - 11, matrixY + 2.5 * cellSize);

    // Legend
    const legendX = matrixX + 5 * cellSize + 10;
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "bold");
    pdf.text("Legenda:", legendX, matrixY + 2);
    pdf.setFont("helvetica", "normal");

    const legendItems = [
      { label: "Baixo (1-7)", color: [220, 252, 231] },
      { label: "Médio (8-15)", color: [254, 249, 195] },
      { label: "Alto (16-25)", color: [254, 226, 226] },
    ];
    legendItems.forEach((item, i) => {
      const ly = matrixY + 8 + i * 7;
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.rect(legendX, ly, 5, 5, "F");
      pdf.setTextColor(0, 0, 0);
      pdf.text(item.label, legendX + 7, ly + 4);
    });

    // Methodology note
    const noteY = matrixY + 5 * cellSize + 12;
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "Metodologia GAMP5 2ª Ed. — RPN = Severidade × Probabilidade × Detectabilidade (escala 1-5, RPN máx. 125)",
      margin,
      noteY
    );
    pdf.text(
      "Classificação: Baixo (1-14) · Médio (15-39) · Alto (40-79) · Crítico (80-125)",
      margin,
      noteY + 5
    );
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Relatório de Avaliação de Riscos — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    pdf.text(
      new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  const safeName = systemName
    ? systemName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 30)
    : "Todos";
  pdf.save(`Avaliacao_Riscos_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
