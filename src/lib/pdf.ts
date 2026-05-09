import { getFunctionUrl, hasSupabaseConfig, supabase } from './supabase';

export async function exportResumePdf(resumeId: string, templateId: string, element: HTMLElement | null) {
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
        body: JSON.stringify({ resumeId, templateId }),
      });

      if (!response.ok) throw new Error(`PDF export failed with ${response.status}`);
      const json = (await response.json()) as { success: true; data: { downloadUrl: string } };
      window.open(json.data.downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }

  if (!element) throw new Error('Resume preview is not ready');
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new JsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`resume-${resumeId}.pdf`);
}
