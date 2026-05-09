import type { Resume } from '../types/resume';
import { getFunctionUrl, hasSupabaseConfig, supabase } from './supabase';

type PdfDocument = InstanceType<typeof import('jspdf').default>;

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 48,
  bottom: 792,
};

const templateAccents: Record<Resume['templateId'], string> = {
  classic: '#1f2937',
  modern: '#6366f1',
  executive: '#0f766e',
  ats: '#475569',
};

export async function exportResumePdf(resume: Resume) {
  if (hasSupabaseConfig && supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const endpoint = getFunctionUrl('resume/export-pdf');
    if (endpoint && session?.access_token) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId: resume.id, templateId: resume.templateId }),
      });

      if (!response.ok) throw new Error(`PDF export failed with ${response.status}`);
      const json = (await response.json()) as { success: true; data: { downloadUrl: string } };
      window.open(json.data.downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }

  const { default: JsPDF } = await import('jspdf');
  const pdf = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  renderResumeDocument(pdf, resume);
  pdf.save(`${slugify(resume.title || 'resume')}.pdf`);
}

function renderResumeDocument(pdf: PdfDocument, resume: Resume) {
  const accent = templateAccents[resume.templateId] ?? templateAccents.modern;
  const accentRgb = hexToRgb(accent);
  const textRgb = hexToRgb('#111827');
  const mutedRgb = hexToRgb('#64748b');
  let y = PAGE.margin;

  const displayName =
    [resume.personalInfo.firstName, resume.personalInfo.lastName].filter(Boolean).join(' ') || 'Champ';
  const role = resume.jobRole || resume.title;

  setText(pdf, textRgb);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.text(displayName, PAGE.margin, y + 28);

  setText(pdf, accentRgb);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(role, PAGE.margin, y + 48);

  const contactLines = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
    resume.personalInfo.linkedin,
    resume.personalInfo.github,
    resume.personalInfo.portfolio,
  ].filter(Boolean) as string[];

  setText(pdf, mutedRgb);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  contactLines.forEach((line, index) => {
    pdf.text(line, PAGE.width - PAGE.margin, y + 12 + index * 13, { align: 'right' });
  });

  y += 74;
  drawRule(pdf, y, accentRgb);
  y += 34;

  y = sectionTitle(pdf, 'Summary', y, accentRgb);
  const summary = resume.summary.useEnhanced ? resume.summary.enhancedText : resume.summary.rawText;
  y = paragraph(pdf, summary, y, PAGE.width - PAGE.margin * 2, mutedRgb);

  y += 10;
  y = sectionTitle(pdf, 'Experience', y, accentRgb);
  for (const entry of resume.experience) {
    y = ensureSpace(pdf, y, 96);
    setText(pdf, textRgb);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(entry.role || 'Role', PAGE.margin, y);

    setText(pdf, mutedRgb);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const dateText = `${entry.startDate || 'Start'} - ${entry.current ? 'Present' : entry.endDate || 'Present'}`;
    pdf.text(dateText, PAGE.width - PAGE.margin, y, { align: 'right' });

    y += 15;
    setText(pdf, textRgb);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.text(entry.company || 'Company', PAGE.margin, y);

    const location = entry.location ? ` • ${entry.location}` : '';
    setText(pdf, mutedRgb);
    pdf.setFont('helvetica', 'normal');
    pdf.text(location, PAGE.margin + pdf.getTextWidth(entry.company || 'Company') + 4, y);
    y += 16;

    const bullets = (entry.useEnhanced ? entry.enhancedBullets : entry.rawBullets).filter(Boolean);
    y = bulletList(pdf, bullets, y, PAGE.width - PAGE.margin * 2, mutedRgb, accentRgb);
    y += 8;
  }

  y += 4;
  y = sectionTitle(pdf, 'Skills', y, accentRgb);
  y = skillGroup(pdf, 'Technical', resume.skills.technical, y, mutedRgb, textRgb);
  y = skillGroup(pdf, 'Tools', resume.skills.tools, y, mutedRgb, textRgb);
  y = skillGroup(pdf, 'Soft', resume.skills.soft, y, mutedRgb, textRgb);
  y = skillGroup(pdf, 'Targeted', resume.skills.aiSuggested, y, mutedRgb, textRgb);

  y += 8;
  y = sectionTitle(pdf, 'Education', y, accentRgb);
  for (const entry of resume.education) {
    y = ensureSpace(pdf, y, 66);
    setText(pdf, textRgb);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(entry.institution || 'Institution', PAGE.margin, y);

    y += 15;
    setText(pdf, mutedRgb);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.text(`${entry.degree}, ${entry.field}`.replace(/^,\s*/, ''), PAGE.margin, y);

    y += 14;
    pdf.setFontSize(9.5);
    pdf.text(`${entry.startYear} - ${entry.endYear ?? 'Present'}`, PAGE.margin, y);

    if (entry.honors) {
      y += 14;
      pdf.text(entry.honors, PAGE.margin, y);
    }
    y += 14;
  }
}

function sectionTitle(pdf: PdfDocument, title: string, y: number, accent: Rgb) {
  y = ensureSpace(pdf, y, 42);
  setText(pdf, accent);
  pdf.circle(PAGE.margin + 3, y - 4, 3, 'F');
  setText(pdf, hexToRgb('#111827'));
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title.toUpperCase(), PAGE.margin + 16, y);
  return y + 20;
}

function paragraph(pdf: PdfDocument, text: string, y: number, width: number, color: Rgb) {
  setText(pdf, color);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const lines = pdf.splitTextToSize(text || '', width) as string[];
  for (const line of lines) {
    y = ensureSpace(pdf, y, 16);
    pdf.text(line, PAGE.margin, y);
    y += 15;
  }
  return y;
}

function bulletList(pdf: PdfDocument, bullets: string[], y: number, width: number, color: Rgb, accent: Rgb) {
  setText(pdf, color);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.2);
  for (const bullet of bullets) {
    const lines = pdf.splitTextToSize(bullet, width - 18) as string[];
    y = ensureSpace(pdf, y, lines.length * 14 + 6);
    setText(pdf, accent);
    pdf.circle(PAGE.margin + 4, y - 3, 2, 'F');
    setText(pdf, color);
    lines.forEach((line, index) => {
      pdf.text(line, PAGE.margin + 17, y + index * 14);
    });
    y += lines.length * 14 + 5;
  }
  return y;
}

function skillGroup(pdf: PdfDocument, label: string, skills: string[], y: number, labelColor: Rgb, textColor: Rgb) {
  if (!skills.length) return y;
  y = ensureSpace(pdf, y, 42);
  setText(pdf, labelColor);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(label.toUpperCase(), PAGE.margin, y);
  y += 13;

  setText(pdf, textColor);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const lines = pdf.splitTextToSize(skills.join(', '), PAGE.width - PAGE.margin * 2) as string[];
  for (const line of lines) {
    y = ensureSpace(pdf, y, 15);
    pdf.text(line, PAGE.margin, y);
    y += 14;
  }
  return y + 7;
}

function ensureSpace(pdf: PdfDocument, y: number, needed: number) {
  if (y + needed <= PAGE.bottom) return y;
  pdf.addPage('a4', 'portrait');
  return PAGE.margin;
}

function drawRule(pdf: PdfDocument, y: number, color: Rgb) {
  setText(pdf, color);
  pdf.setDrawColor(color.r, color.g, color.b);
  pdf.setLineWidth(1);
  pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
}

function setText(pdf: PdfDocument, color: Rgb) {
  pdf.setTextColor(color.r, color.g, color.b);
  pdf.setFillColor(color.r, color.g, color.b);
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'resume'
  );
}
