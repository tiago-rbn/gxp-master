import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CSVOne <onboarding@resend.dev>",
      to: to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  project_id: string;
  project_name: string;
  new_status: string;
  previous_status?: string;
  action_by_name: string;
  action_by_email: string;
  manager_email?: string;
  manager_name?: string;
  rejection_reason?: string;
  company_name?: string;
  company_logo_url?: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "approved":
    case "completed":
      return "#22c55e";
    case "rejected":
      return "#ef4444";
    case "pending":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
};

const getEmailSubject = (status: string, projectName: string): string => {
  switch (status) {
    case "pending":
      return `📋 Projeto aguardando sua aprovação: ${projectName}`;
    case "approved":
      return `✅ Projeto aprovado: ${projectName}`;
    case "rejected":
      return `❌ Projeto rejeitado: ${projectName}`;
    case "completed":
      return `🎉 Projeto concluído: ${projectName}`;
    default:
      return `📝 Atualização de projeto: ${projectName}`;
  }
};

const generateEmailHtml = (data: NotificationRequest): string => {
  const statusColor = getStatusColor(data.new_status);
  const statusLabel = statusLabels[data.new_status] || data.new_status;
  const companyName = data.company_name || "CSVOne";

  let actionText = "";
  if (data.new_status === "pending") {
    actionText = `<p>O projeto <strong>${data.project_name}</strong> foi enviado para aprovação por <strong>${data.action_by_name}</strong>.</p>
    <p>Por favor, revise o projeto e aprove ou rejeite conforme necessário.</p>`;
  } else if (data.new_status === "approved") {
    actionText = `<p>O projeto <strong>${data.project_name}</strong> foi <strong style="color: ${statusColor}">aprovado</strong> por <strong>${data.action_by_name}</strong>.</p>
    <p>O projeto agora pode prosseguir para execução.</p>`;
  } else if (data.new_status === "rejected") {
    actionText = `<p>O projeto <strong>${data.project_name}</strong> foi <strong style="color: ${statusColor}">rejeitado</strong> por <strong>${data.action_by_name}</strong>.</p>
    ${data.rejection_reason ? `<div style="background-color: #fef2f2; border-left: 4px solid ${statusColor}; padding: 12px; margin: 16px 0;">
      <strong>Motivo da Rejeição:</strong>
      <p style="margin: 8px 0 0 0;">${data.rejection_reason}</p>
    </div>` : ""}
    <p>Por favor, revise o projeto e faça as correções necessárias antes de reenviar para aprovação.</p>`;
  } else if (data.new_status === "completed") {
    actionText = `<p>O projeto <strong>${data.project_name}</strong> foi marcado como <strong style="color: ${statusColor}">concluído</strong> por <strong>${data.action_by_name}</strong>.</p>
    <p>Parabéns pela conclusão do projeto!</p>`;
  }

  // Build header with optional company logo
  const logoHtml = data.company_logo_url 
    ? `<img src="${data.company_logo_url}" alt="${companyName}" style="max-height: 50px; max-width: 150px; margin-bottom: 12px; border-radius: 4px;" />`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    ${logoHtml}
    <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">Sistema de Validação GAMP 5</p>
  </div>
  
  <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <div style="display: inline-block; background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
        ${statusLabel}
      </div>
      
      ${actionText}
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
        Esta é uma notificação automática do sistema ${companyName}.
      </p>
    </div>
  </div>
  
  <div style="background-color: #1e3a5f; padding: 16px 24px; border-radius: 0 0 8px 8px;">
    <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0; text-align: center;">
      © ${new Date().getFullYear()} ${companyName} - Sistema de Validação GAMP 5
    </p>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-project-status function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Notification request data:", JSON.stringify(data));

    if (!data.project_id || !data.project_name || !data.new_status) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipients: string[] = [];
    const recipientNames: string[] = [];

    // Determine who should receive the notification
    if (data.new_status === "pending" && data.manager_email) {
      // Notify manager when project is submitted for approval
      recipients.push(data.manager_email);
      recipientNames.push(data.manager_name || "Gerente");
    } else if (data.new_status === "approved" || data.new_status === "rejected" || data.new_status === "completed") {
      // Notify the person who submitted (action_by_email is the one who changed status)
      // In a real scenario, we'd notify the project owner/submitter
      // For now, we'll notify the manager
      if (data.manager_email) {
        recipients.push(data.manager_email);
        recipientNames.push(data.manager_name || "Gerente");
      }
    }

    // Also notify the action taker for confirmation (optional)
    if (data.action_by_email && !recipients.includes(data.action_by_email)) {
      recipients.push(data.action_by_email);
      recipientNames.push(data.action_by_name);
    }

    if (recipients.length === 0) {
      console.log("No recipients to notify");
      return new Response(
        JSON.stringify({ message: "No recipients to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending notification to: ${recipients.join(", ")}`);

    const subject = getEmailSubject(data.new_status, data.project_name);
    const html = generateEmailHtml(data);

    const emailResponse = await sendEmail(recipients, subject, html);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-project-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
