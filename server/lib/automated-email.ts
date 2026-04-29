import { storage } from "../storage";
import { sendCustomEmailDetailed, type EmailSendResult } from "../email";

type TemplateValue = string | number | boolean | Date | null | undefined;

interface AutomatedTemplateEmailOptions {
  templateName: string;
  recipientName: string;
  recipientEmail: string;
  data: Record<string, TemplateValue>;
  fallbackSubject: string;
  fallbackMessage: string;
  fallbackSend: () => Promise<EmailSendResult>;
  senderName?: string;
}

export interface AutomatedTemplateEmailResult {
  result: EmailSendResult;
  subject: string;
  message: string;
  templateId?: string;
  templateSource: "admin_template" | "code_template" | "disabled_template";
}

export function renderTemplateText(value: string, data: Record<string, TemplateValue>) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const replacement = data[key];
    if (replacement instanceof Date) return replacement.toISOString();
    if (replacement === null || replacement === undefined) return "";
    return String(replacement);
  });
}

export async function sendAutomatedTemplateEmail(
  options: AutomatedTemplateEmailOptions
): Promise<AutomatedTemplateEmailResult> {
  const template = await storage.getEmailTemplateByName(options.templateName);

  if (template && template.isActive === false) {
    return {
      result: {
        success: false,
        error: `${options.templateName.replace(/_/g, " ")} template is disabled`,
      },
      subject: options.fallbackSubject,
      message: options.fallbackMessage,
      templateId: template.id,
      templateSource: "disabled_template",
    };
  }

  if (template) {
    const subject = renderTemplateText(template.subject, options.data);
    const message = renderTemplateText(template.body, options.data);
    const result = await sendCustomEmailDetailed({
      recipientName: options.recipientName,
      recipientEmail: options.recipientEmail,
      subject,
      message,
      senderName: options.senderName,
      includeGreeting: false,
    });

    return {
      result,
      subject,
      message,
      templateId: template.id,
      templateSource: "admin_template",
    };
  }

  return {
    result: await options.fallbackSend(),
    subject: options.fallbackSubject,
    message: options.fallbackMessage,
    templateSource: "code_template",
  };
}

