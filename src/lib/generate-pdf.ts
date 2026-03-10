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

// Color palette matching the app theme
const COLORS = {
  darkPurple: [18, 10, 31] as [number, number, number],
  gold: [238, 179, 42] as [number, number, number],
  goldLight: [255, 215, 100] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [200, 200, 210] as [number, number, number],
  mediumGray: [140, 130, 150] as [number, number, number],
  green: [72, 199, 142] as [number, number, number],
  orange: [255, 159, 67] as [number, number, number],
  blue: [100, 149, 237] as [number, number, number],
};

export type ReportLevel = "basico" | "intermediario" | "completo";

export const REPORT_LEVEL_LABELS: Record<ReportLevel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  completo: "Completo",
};

export const generateEnneagramPDF = (result: PDFResult, logoBase64?: string, skills?: SkillsData | null, level: ReportLevel = "completo") => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  let y = 0;

  const checkPage = (needed: number = 20) => {
    if (y > pageH - 30 - needed) {
      doc.addPage();
      y = margin;
      addPageBg();
    }
  };

  const addPageBg = () => {
    doc.setFillColor(...COLORS.darkPurple);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const addText = (text: string, size: number = 10, color: [number, number, number] = COLORS.lightGray, bold = false, maxWidth = contentW) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkPage();
      doc.text(line, margin, y);
      y += size * 0.45 + 1;
    }
    y += 2;
  };

  const addCenteredText = (text: string, size: number, color: [number, number, number] = COLORS.gold, bold = true) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, pageW / 2, y, { align: "center" });
    y += size * 0.45 + 2;
  };

  const addSectionTitle = (title: string) => {
    checkPage(15);
    y += 4;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 30, y);
    y += 6;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.gold);
    doc.text(title, margin, y);
    y += 8;
  };

  const addSeparator = () => {
    checkPage(8);
    doc.setDrawColor(...COLORS.mediumGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const addField = (label: string, value: string) => {
    checkPage();
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.mediumGray);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text(value, margin + 50, y);
    y += 6;
  };

  // === Draw horizontal bar chart for types ===
  const drawTypesChart = () => {
    checkPage(60);
    addSectionTitle("GRÁFICO DE TIPOS PROVÁVEIS");

    const types: { name: string; pct: number; color: [number, number, number] }[] = [];
    if (result.type_1_pct > 0) types.push({ name: result.type_1_name, pct: result.type_1_pct, color: COLORS.gold });
    if (result.type_2_name && result.type_2_pct && result.type_2_pct > 0) {
      types.push({ name: result.type_2_name, pct: result.type_2_pct, color: COLORS.blue });
    }
    if (result.type_3_name && result.type_3_pct && result.type_3_pct > 0) {
      types.push({ name: result.type_3_name, pct: result.type_3_pct, color: COLORS.green });
    }

    const barH = 12;
    const barGap = 6;
    const labelW = 55;
    const maxBarW = contentW - labelW - 25;

    for (const t of types) {
      checkPage(barH + barGap);

      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.white);
      doc.text(t.name, margin, y + barH / 2 + 1);

      // Background bar
      const barX = margin + labelW;
      doc.setFillColor(40, 30, 55);
      doc.roundedRect(barX, y - 2, maxBarW, barH, 3, 3, "F");

      // Value bar
      const barW = (t.pct / 100) * maxBarW;
      doc.setFillColor(...t.color);
      doc.roundedRect(barX, y - 2, barW, barH, 3, 3, "F");

      // Percentage text
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.white);
      doc.text(`${t.pct}%`, barX + maxBarW + 3, y + barH / 2 + 1);

      y += barH + barGap;
    }
    y += 4;
  };

  // === Draw skills sections ===
  const drawSkills = (skillsData: SkillsData) => {
    // Natural skills
    checkPage(30);
    addSectionTitle("HABILIDADES NATURAIS");
    
    for (const skill of skillsData.habilidades_naturais) {
      checkPage(8);
      doc.setFillColor(...COLORS.green);
      doc.circle(margin + 3, y - 1.5, 1.5, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.white);
      doc.text(skill, margin + 8, y);
      y += 7;
    }

    y += 4;
    addSeparator();

    // Skills to develop
    checkPage(30);
    addSectionTitle("HABILIDADES A DESENVOLVER");
    
    for (const skill of skillsData.habilidades_desenvolver) {
      checkPage(8);
      doc.setFillColor(...COLORS.orange);
      doc.circle(margin + 3, y - 1.5, 1.5, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.white);
      doc.text(skill, margin + 8, y);
      y += 7;
    }

    y += 4;
  };

  const userName = result.profiles?.display_name || "Não informado";
  const phone = (result.profiles as any)?.phone || "";

  // === PAGE 1: Cover / Header ===
  addPageBg();

  // Top gold bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageW, 4, "F");

  // Logo
  if (logoBase64) {
    const logoW = 40;
    const logoH = 40;
    doc.addImage(logoBase64, "PNG", pageW / 2 - logoW / 2, 10, logoW, logoH);
    y = 55;
  } else {
    y = 35;
  }

  // Title
  const levelLabel = REPORT_LEVEL_LABELS[level].toUpperCase();
  addCenteredText(`RELATÓRIO ${levelLabel} DE ENEAGRAMA`, 22, COLORS.gold);
  y += 2;
  addCenteredText("Análise Personalizada de Personalidade", 11, COLORS.mediumGray, false);
  y += 8;

  // Gold decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
  y += 12;

  // Main type highlight
  addCenteredText(result.type_1_name, 20, COLORS.white);
  addCenteredText(`${result.type_1_pct}%`, 28, COLORS.gold);
  y += 5;

  if (result.type_2_name) {
    addCenteredText(`2º ${result.type_2_name} (${result.type_2_pct}%)  ·  3º ${result.type_3_name || "—"} (${result.type_3_pct || 0}%)`, 10, COLORS.lightGray, false);
    y += 3;
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

  // === Detailed Results ===
  addSectionTitle("PERFIL DETALHADO");

  if (result.wing) addField("Asa:", result.wing);
  if (result.dominant_subtype) addField("Subtipo:", result.dominant_subtype);
  if (result.dominant_center) addField("Centro:", result.dominant_center);
  if (result.tritype) addField("Tritipo:", result.tritype);
  if (result.health_level) addField("Nível de Saúde:", `${result.health_level}/9`);

  // Subtype percentages
  if (result.subtype_preservation != null || result.subtype_social != null || result.subtype_sexual != null) {
    y += 3;
    addText("Distribuição de Subtipos:", 10, COLORS.mediumGray, true);
    if (result.subtype_preservation != null) addField("  Autopreservação:", `${result.subtype_preservation}%`);
    if (result.subtype_social != null) addField("  Social:", `${result.subtype_social}%`);
    if (result.subtype_sexual != null) addField("  Sexual:", `${result.subtype_sexual}%`);
  }

  addSeparator();

  // === Skills ===
  if (skills) {
    drawSkills(skills);
    addSeparator();
  }

  // === Integration / Disintegration ===
  if (result.integration_direction || result.disintegration_direction) {
    addSectionTitle("DIREÇÕES DE CRESCIMENTO");
    if (result.integration_direction) {
      addText("Direção de Integração (crescimento):", 10, COLORS.mediumGray, true);
      addText(result.integration_direction, 10, COLORS.lightGray);
      y += 2;
    }
    if (result.disintegration_direction) {
      addText("Direção de Desintegração (estresse):", 10, COLORS.mediumGray, true);
      addText(result.disintegration_direction, 10, COLORS.lightGray);
    }
    addSeparator();
  }

  // === Summary / Analysis ===
  if (result.summary) {
    addSectionTitle("ANÁLISE COMPLETA");
    const cleanSummary = result.summary.replace(/[#*_`]/g, "");
    addText(cleanSummary, 10, COLORS.lightGray);
    addSeparator();
  }

  // === Footer on last page ===
  y = Math.max(y, 250);
  checkPage(30);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mediumGray);
  doc.text("© 2026 Silvonei Sonntag Desenvolvimento Humano Ltda — Todos os direitos reservados", pageW / 2, y, { align: "center" });
  y += 5;
  doc.text("Este relatório é apenas indicativo e não substitui avaliação profissional.", pageW / 2, y, { align: "center" });

  // Bottom gold bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  doc.save(`eneagrama-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`);
};
