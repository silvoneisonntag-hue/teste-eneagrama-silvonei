import jsPDF from "jspdf";

interface PDFResult {
  type_1_name: string;
  type_1_pct: number;
  type_2_name: string | null;
  type_2_pct: number | null;
  type_3_name: string | null;
  type_3_pct: number | null;
  dominant_subtype: string | null;
  wing: string | null;
  health_level: number | null;
  dominant_center: string | null;
  tritype: string | null;
  summary: string | null;
  created_at: string;
  user_id: string;
  integration_direction?: string | null;
  disintegration_direction?: string | null;
  subtype_preservation?: number | null;
  subtype_social?: number | null;
  subtype_sexual?: number | null;
  profiles: { display_name: string | null; phone?: string | null } | null;
}

interface SkillsData {
  habilidades_naturais: string[];
  habilidades_desenvolver: string[];
}

// New color palette: white background with dark purple text
const COLORS = {
  white: [255, 255, 255] as [number, number, number],
  darkPurple: [35, 20, 60] as [number, number, number],
  purple: [60, 35, 100] as [number, number, number],
  purpleLight: [100, 70, 150] as [number, number, number],
  gold: [180, 130, 20] as [number, number, number],
  goldDark: [150, 110, 15] as [number, number, number],
  gray: [120, 110, 130] as [number, number, number],
  lightGray: [230, 225, 235] as [number, number, number],
  green: [40, 140, 90] as [number, number, number],
  orange: [200, 120, 30] as [number, number, number],
  blue: [60, 100, 180] as [number, number, number],
};

export type ReportLevel = "basico" | "intermediario" | "completo";

export const REPORT_LEVEL_LABELS: Record<ReportLevel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  completo: "Completo",
};

export const generateEnneagramPDF = (result: PDFResult, logoBase64?: string, skills?: SkillsData | null, level: ReportLevel = "completo", returnBlob = false): Blob | void => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  let y = 0;

  const checkPage = (needed: number = 14) => {
    if (y > pageH - 20 - needed) {
      doc.addPage();
      y = margin;
      addPageBg();
    }
  };

  const addPageBg = () => {
    doc.setFillColor(...COLORS.white);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const addText = (text: string, size: number = 10, color: [number, number, number] = COLORS.darkPurple, bold = false, maxWidth = contentW) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkPage();
      doc.text(line, margin, y);
      y += size * 0.42;
    }
    y += 1;
  };

  const addCenteredText = (text: string, size: number, color: [number, number, number] = COLORS.darkPurple, bold = true) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, pageW / 2, y, { align: "center" });
    y += size * 0.42 + 1;
  };

  const addSectionTitle = (title: string) => {
    checkPage(12);
    y += 3;
    doc.setDrawColor(...COLORS.purple);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 25, y);
    y += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.purple);
    doc.text(title, margin, y);
    y += 6;
  };

  const addSeparator = () => {
    checkPage(6);
    y += 1;
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  };

  const addField = (label: string, value: string) => {
    checkPage();
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.gray);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkPurple);
    doc.text(value, margin + 50, y);
    y += 5;
  };

  // === Draw horizontal bar chart for types ===
  const drawTypesChart = () => {
    checkPage(50);
    addSectionTitle("GRÁFICO DE TIPOS PROVÁVEIS");

    const types: { name: string; pct: number; color: [number, number, number] }[] = [];
    if (result.type_1_pct > 0) types.push({ name: result.type_1_name, pct: result.type_1_pct, color: COLORS.purple });
    if (result.type_2_name && result.type_2_pct && result.type_2_pct > 0) {
      types.push({ name: result.type_2_name, pct: result.type_2_pct, color: COLORS.blue });
    }
    if (result.type_3_name && result.type_3_pct && result.type_3_pct > 0) {
      types.push({ name: result.type_3_name, pct: result.type_3_pct, color: COLORS.green });
    }

    const barH = 10;
    const barGap = 4;
    const labelW = 55;
    const maxBarW = contentW - labelW - 25;

    for (const t of types) {
      checkPage(barH + barGap);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkPurple);
      doc.text(t.name, margin, y + barH / 2 + 1);

      const barX = margin + labelW;
      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(barX, y - 1, maxBarW, barH, 2, 2, "F");

      const barW = (t.pct / 100) * maxBarW;
      doc.setFillColor(...t.color);
      doc.roundedRect(barX, y - 1, barW, barH, 2, 2, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkPurple);
      doc.text(`${t.pct}%`, barX + maxBarW + 3, y + barH / 2 + 1);

      y += barH + barGap;
    }
    y += 2;
  };

  // === Draw skills sections ===
  const drawSkills = (skillsData: SkillsData) => {
    checkPage(25);
    addSectionTitle("HABILIDADES NATURAIS");
    
    for (const skill of skillsData.habilidades_naturais) {
      checkPage(6);
      doc.setFillColor(...COLORS.green);
      doc.circle(margin + 3, y - 1, 1.5, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.darkPurple);
      doc.text(skill, margin + 8, y);
      y += 5;
    }

    y += 2;
    addSeparator();

    checkPage(25);
    addSectionTitle("HABILIDADES A DESENVOLVER");
    
    for (const skill of skillsData.habilidades_desenvolver) {
      checkPage(6);
      doc.setFillColor(...COLORS.orange);
      doc.circle(margin + 3, y - 1, 1.5, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.darkPurple);
      doc.text(skill, margin + 8, y);
      y += 5;
    }

    y += 2;
  };

  const userName = result.profiles?.display_name || "Não informado";
  const phone = (result.profiles as any)?.phone || "";

  // === PAGE 1: Cover / Header ===
  addPageBg();

  // Top purple bar
  doc.setFillColor(...COLORS.purple);
  doc.rect(0, 0, pageW, 4, "F");

  // Logo
  if (logoBase64) {
    const logoW = 36;
    const logoH = 36;
    doc.addImage(logoBase64, "PNG", pageW / 2 - logoW / 2, 10, logoW, logoH);
    y = 52;
  } else {
    y = 30;
  }

  // Title
  const levelLabel = REPORT_LEVEL_LABELS[level].toUpperCase();
  addCenteredText(`RELATÓRIO ${levelLabel} DE ENEAGRAMA`, 20, COLORS.darkPurple);
  y += 1;
  addCenteredText("Análise Personalizada de Personalidade", 10, COLORS.gray, false);
  y += 5;

  // Decorative line
  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(0.5);
  doc.line(pageW / 2 - 35, y, pageW / 2 + 35, y);
  y += 8;

  // Main type highlight
  addCenteredText(result.type_1_name, 18, COLORS.darkPurple);
  addCenteredText(`${result.type_1_pct}%`, 24, COLORS.purple);
  y += 3;

  if (result.type_2_name) {
    addCenteredText(`2º ${result.type_2_name} (${result.type_2_pct}%)  ·  3º ${result.type_3_name || "—"} (${result.type_3_pct || 0}%)`, 9, COLORS.gray, false);
    y += 2;
  }

  addSeparator();

  // === User Data ===
  addSectionTitle("DADOS DO PARTICIPANTE");
  addField("Nome:", userName);
  if (phone) addField("Telefone:", phone);
  addField("Data:", new Date(result.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }));

  addSeparator();

  // === Types Chart ===
  drawTypesChart();

  addSeparator();

  // === Detailed Results (intermediário + completo) ===
  if (level === "intermediario" || level === "completo") {
    addSectionTitle("PERFIL DETALHADO");

    if (result.wing) addField("Asa:", result.wing);
    if (result.dominant_subtype) addField("Subtipo:", result.dominant_subtype);
    if (result.dominant_center) addField("Centro:", result.dominant_center);
    if (result.tritype) addField("Tritipo:", result.tritype);
    if (result.health_level) addField("Nível de Saúde:", `${result.health_level}/9`);

    if (result.subtype_preservation != null || result.subtype_social != null || result.subtype_sexual != null) {
      y += 2;
      addText("Distribuição de Subtipos:", 9, COLORS.gray, true);
      if (result.subtype_preservation != null) addField("  Autopreservação:", `${result.subtype_preservation}%`);
      if (result.subtype_social != null) addField("  Social:", `${result.subtype_social}%`);
      if (result.subtype_sexual != null) addField("  Sexual:", `${result.subtype_sexual}%`);
    }

    addSeparator();

    // === Skills (intermediário + completo) ===
    if (skills) {
      drawSkills(skills);
      addSeparator();
    }
  }

  // === Integration / Disintegration (completo only) ===
  if (level === "completo" && (result.integration_direction || result.disintegration_direction)) {
    addSectionTitle("DIREÇÕES DE CRESCIMENTO");
    if (result.integration_direction) {
      addText("Direção de Integração (crescimento):", 9, COLORS.gray, true);
      addText(result.integration_direction, 9, COLORS.darkPurple);
      y += 1;
    }
    if (result.disintegration_direction) {
      addText("Direção de Desintegração (estresse):", 9, COLORS.gray, true);
      addText(result.disintegration_direction, 9, COLORS.darkPurple);
    }
    addSeparator();
  }

  // === Summary / Analysis (completo only) ===
  if (level === "completo" && result.summary) {
    addSectionTitle("ANÁLISE COMPLETA");
    const cleanSummary = result.summary.replace(/[#*_`]/g, "");
    addText(cleanSummary, 9, COLORS.darkPurple);
    addSeparator();
  }

  // === Footer on last page ===
  const footerY = Math.max(y + 5, pageH - 30);
  if (footerY > pageH - 20) {
    doc.addPage();
    addPageBg();
    y = pageH - 30;
  } else {
    y = footerY;
  }
  
  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text("© 2026 Silvonei Sonntag Desenvolvimento Humano Ltda — Todos os direitos reservados", pageW / 2, y, { align: "center" });
  y += 4;
  doc.setTextColor(...COLORS.purpleLight);
  doc.text("Este relatório é apenas indicativo e não substitui avaliação profissional.", pageW / 2, y, { align: "center" });

  // Bottom purple bar
  doc.setFillColor(...COLORS.purple);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  const fileName = `eneagrama-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`;

  if (returnBlob) {
    return doc.output("blob");
  }
  doc.save(fileName);
};

export const getPDFFileName = (result: PDFResult) => {
  const userName = result.profiles?.display_name || "Não informado";
  return `eneagrama-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`;
};
