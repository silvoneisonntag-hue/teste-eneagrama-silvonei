import jsPDF from "jspdf";

export interface PDFResult {
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

export interface ReportSections {
  perfil_dominante?: string;
  caracteristicas?: string;
  motivacoes_medos?: string;
  comportamentos?: string;
  equipe_conflitos?: string;
  influencia_asas?: string;
  influencia_secundario?: string;
  integracao?: string;
  estresse?: string;
  nivel_saude?: string;
  habilidades_naturais?: string[];
  habilidades_desenvolver?: string[];
  reflexao?: string[];
  dicas_relacionamento?: { tipo: string; dica: string }[];
  desenvolvimento?: string[];
}

export type ReportLevel = "basico" | "intermediario" | "completo";

export const REPORT_LEVEL_LABELS: Record<ReportLevel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  completo: "Completo",
};

// Color palette — warm "Mapa Interior" design system
const C = {
  white: [247, 245, 242] as const,       // #F7F5F2
  darkPurple: [45, 45, 45] as const,     // #2D2D2D (foreground)
  purple: [109, 104, 117] as const,      // #6D6875 (primary)
  purpleLight: [181, 131, 141] as const, // #B5838D (accent)
  gold: [181, 131, 141] as const,        // accent as accent bar
  goldDark: [139, 90, 100] as const,     // darker accent
  goldBg: [247, 240, 235] as const,      // warm light bg for banners
  gray: [120, 110, 115] as const,        // muted
  lightGray: [235, 228, 225] as const,   // soft warm gray
  green: [120, 150, 120] as const,       // muted sage green
  orange: [190, 140, 100] as const,      // warm amber
  blue: [120, 130, 150] as const,        // muted blue
  red: [181, 100, 100] as const,         // muted warm red
  chartColors: [
    [181, 131, 141],  // accent rose
    [109, 104, 117],  // primary purple-gray
    [120, 150, 120],  // sage green
    [190, 140, 100],  // warm amber
    [150, 120, 140],  // dusty mauve
    [139, 90, 100],   // deep rose
    [160, 145, 130],  // warm taupe
    [130, 150, 160],  // slate blue
    [170, 130, 110],  // terra cotta
  ] as [number, number, number][],
};

type Color = readonly [number, number, number];

// Fixed introductory texts
const INTRO_TEXT = `Bem-vindo à sua Jornada de Autoconhecimento!\n\nEste relatório é o resultado de uma investigação profunda sobre os padrões que organizam a forma como você sente, pensa e age. A partir de uma conversa cuidadosa, identificamos as estruturas emocionais e comportamentais que moldam suas escolhas, seus relacionamentos e sua forma de estar no mundo.\n\nDiferente de testes superficiais, este processo revela as motivações profundas, os medos centrais e os ciclos repetitivos que operam — muitas vezes sem que você perceba. Este relatório traz uma análise personalizada para ajudá-lo a se entender melhor, com insights práticos que podem transformar sua vida.`;

const ORIGIN_TEXT = `Este processo se baseia em uma investigação profunda dos padrões emocionais, comportamentais e relacionais que moldam a personalidade humana. Combinamos sabedoria de tradições psicológicas com uma abordagem sistêmica moderna.\n\nAo longo de uma conversa cuidadosa, identificamos as estruturas internas que organizam a forma como você pensa, sente e age — revelando motivações profundas, medos centrais e dinâmicas que operam muitas vezes de forma inconsciente. Este mapeamento permite um nível de autoconhecimento que vai muito além de testes superficiais.`;

const DYNAMICS_TEXT = `Sua personalidade não é estática — ela se transforma de acordo com o contexto, o nível de saúde emocional e as relações que você mantém. As dinâmicas internas mostram como você cresce ou enfrenta desafios.\n\nQuando está em crescimento (integração), você adota qualidades positivas de outros padrões; sob pressão (estresse), pode manifestar comportamentos mais reativos e defensivos.`;

const HEALTH_INTRO_TEXT = `Os Níveis de Saúde mostram como você está vivendo suas qualidades e enfrentando seus desafios:\n\n• Saudável: Suas melhores qualidades brilham naturalmente, inspirando você e quem está ao seu redor.\n• Médio: Um momento de equilíbrio, onde você está crescendo. Suas forças estão presentes, mas desafios podem surgir.\n• Não Saudável: Um ponto em que os desafios pesam mais, mas este é também um convite para se reconectar com sua essência.`;

const PRACTICAL_TEXT = `Este mapeamento não é apenas teoria — é uma ferramenta prática para transformar sua vida. Ele é aplicado em áreas como coaching, terapia, liderança e relacionamentos, ajudando a identificar pontos cegos e a encontrar caminhos para o crescimento.\n\nCom este relatório, você terá insights práticos para aplicar no seu dia a dia, seja para tomar decisões mais conscientes, fortalecer conexões ou alcançar seus objetivos com mais clareza.`;

const RESOURCES_TEXT = [
  { cat: "Livros", items: ["A Sabedoria do Eneagrama — Don Richard Riso e Russ Hudson", "O Caminho do Eneagrama — Beatrice Chestnut"] },
  { cat: "Sites", items: ["The Enneagram Institute (enneagraminstitute.com)", "Integrative 9 (integrative9.com)"] },
  { cat: "Podcasts", items: ["The Enneagram Journey", "Typology — por Ian Morgan Cron"] },
];

const NINE_TYPES_TEXT = [
  "Tipo 1 - O Perfeccionista: Ética. Movido por um desejo de integridade, teme a imperfeição e busca melhorar o mundo com responsabilidade.",
  "Tipo 2 - O Prestativo: Generosidade. Guiado pelo desejo de ser amado, teme a rejeição e prioriza ajudar os outros.",
  "Tipo 3 - O Bem-Sucedido: Sucesso. Motivado por reconhecimento, teme o fracasso e adapta-se para alcançar seus objetivos.",
  "Tipo 4 - O Individualista: Autenticidade. Busca significado, teme ser comum e expressa-se por meio da criatividade e da emoção.",
  "Tipo 5 - O Observador: Conhecimento. Movido pela busca de saber, teme a incompetência e valoriza a independência intelectual.",
  "Tipo 6 - O Leal: Segurança. Guiado pela necessidade de estabilidade, teme o abandono e busca apoio através da lealdade.",
  "Tipo 7 - O Entusiasta: Liberdade. Motivado por novas experiências, teme a dor e evita limitações com otimismo e aventura.",
  "Tipo 8 - O Desafiador: Força. Busca proteção, teme a vulnerabilidade e age com assertividade para defender a si e aos outros.",
  "Tipo 9 - O Pacificador: Harmonia. Deseja paz, teme o conflito e media situações com paciência e aceitação.",
];

// 10-section parser matching the AI report structure
const SECTION_HEADINGS = [
  { pattern: /padr[ãa]o\s+psicol[óo]gico\s+central/i, title: "Padrão Psicológico Central" },
  { pattern: /mecanismo\s+interno/i, title: "Mecanismo Interno e Estratégias" },
  { pattern: /origem\s+emocional/i, title: "Origem Emocional e Adaptação Primária" },
  { pattern: /express[ãa]o\s+instintiva/i, title: "Expressão Instintiva e Foco de Energia" },
  { pattern: /integra[çc][ãa]o\s+do\s+subtipo/i, title: "Integração do Subtipo e Dinâmica Única" },
  { pattern: /for[çc]as\s+e\s+recursos/i, title: "Forças e Recursos" },
  { pattern: /pontos\s+cegos/i, title: "Pontos Cegos e Desafios" },
  { pattern: /ciclos\s+repetitivos/i, title: "Ciclos Repetitivos e Padrões Sistêmicos" },
  { pattern: /caminho\s+de\s+crescimento/i, title: "Caminho de Crescimento e Evolução" },
  { pattern: /reflex[ãa]o\s+final/i, title: "Reflexão Final" },
];

function parseSummaryIntoSections(summary: string): { title: string; content: string }[] {
  const lines = summary.split("\n");
  const sections: { title: string; content: string }[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
    const match = SECTION_HEADINGS.find(h => h.pattern.test(cleanLine));

    if (match) {
      if (currentTitle && currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = match.title;
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }

  if (currentTitle && currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }

  return sections;
}

export const generateEnneagramPDF = (
  result: PDFResult,
  logoBase64?: string,
  sections?: ReportSections | null,
  level: ReportLevel = "completo",
  returnBlob = false,
): Blob | void => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin
  const cw = pw - m * 2; // content width
  let y = 0;
  let pageNum = 0;

  // ── Helpers ──────────────────────────────────────────────
  const col = (c: Color) => c as unknown as [number, number, number];

  const newPage = () => {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    doc.setFillColor(...col(C.white));
    doc.rect(0, 0, pw, ph, "F");
    // top gold bar
    doc.setFillColor(...col(C.gold));
    doc.rect(0, 0, pw, 3, "F");
    // bottom gold bar
    doc.setFillColor(...col(C.gold));
    doc.rect(0, ph - 3, pw, 3, "F");
    y = 18;
  };

  const check = (needed = 14) => {
    if (y > ph - 18 - needed) {
      newPage();
    }
  };

  const headerLine = () => {
    check(4);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(C.gray));
    const name = result.profiles?.display_name || "Participante";
    doc.text(`Mapa Interior: ${name}`, m, 10);
  };

  const text = (t: string, size = 9, color: Color = C.darkPurple, bold = false, maxW = cw, xOffset = 0) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...col(color));
    const lines = doc.splitTextToSize(t, maxW);
    for (const line of lines) {
      check(size * 0.45);
      doc.text(line, m + xOffset, y);
      y += size * 0.4;
    }
  };

  const centeredText = (t: string, size: number, color: Color = C.darkPurple, bold = true) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...col(color));
    doc.text(t, pw / 2, y, { align: "center" });
    y += size * 0.45 + 1;
  };

  const sectionBanner = (title: string) => {
    check(18);
    y += 2;
    doc.setFillColor(...col(C.goldBg));
    doc.roundedRect(m, y - 5, cw, 12, 2, 2, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(C.goldDark));
    doc.text(title, pw / 2, y + 2, { align: "center" });
    y += 11;
  };

  const sectionTitle = (title: string) => {
    check(14);
    y += 2;
    doc.setDrawColor(...col(C.gold));
    doc.setLineWidth(0.8);
    doc.line(m, y, m + 25, y);
    y += 4;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(C.darkPurple));
    doc.text(title, m, y);
    y += 5;
  };

  const separator = () => {
    check(6);
    y += 1;
    doc.setDrawColor(...col(C.lightGray));
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 3;
  };

  const field = (label: string, value: string) => {
    check();
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(C.gray));
    doc.text(label, m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(C.darkPurple));
    doc.text(value, m + 50, y);
    y += 5;
  };

  const bullet = (t: string, color: Color = C.darkPurple, bulletColor: Color = C.gold) => {
    check(6);
    doc.setFillColor(...col(bulletColor));
    doc.circle(m + 3, y - 1, 1.2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(color));
    const lines = doc.splitTextToSize(t, cw - 10);
    for (const line of lines) {
      check(4);
      doc.text(line, m + 8, y);
      y += 3.8;
    }
    y += 0.5;
  };

  const userName = result.profiles?.display_name || "Não informado";
  const phone = (result.profiles as any)?.phone || "";
  const dateStr = new Date(result.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // ═══════════════════════════════════════════════════════════
  // PAGE 1: COVER
  // ═══════════════════════════════════════════════════════════
  newPage();

  // Logo
  if (logoBase64) {
    const lw = 38, lh = 38;
    doc.addImage(logoBase64, "PNG", pw / 2 - lw / 2, 12, lw, lh);
    y = 56;
  } else {
    y = 35;
  }

  // Title
  centeredText("Mapa Interior", 26, C.gold);
  y += 2;
  centeredText(userName, 16, C.darkPurple);
  y += 6;

  // Decorative line
  doc.setDrawColor(...col(C.gold));
  doc.setLineWidth(1);
  doc.line(pw / 2 - 40, y, pw / 2 + 40, y);
  y += 12;

  // Main type highlight box
  doc.setFillColor(...col(C.goldBg));
  doc.roundedRect(m + 15, y - 4, cw - 30, 40, 4, 4, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...col(C.goldDark));
  doc.text("Padrão Dominante", pw / 2, y + 4, { align: "center" });
  doc.setFontSize(18);
  doc.setTextColor(...col(C.darkPurple));
  doc.text(result.type_1_name, pw / 2, y + 16, { align: "center" });
  doc.setFontSize(22);
  doc.setTextColor(...col(C.purple));
  doc.text(`${result.type_1_pct}%`, pw / 2, y + 28, { align: "center" });
  y += 46;

  // Secondary types
  if (result.type_2_name) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(C.gray));
    const secondary = `2º ${result.type_2_name} (${result.type_2_pct}%)  ·  3º ${result.type_3_name || "—"} (${result.type_3_pct || 0}%)`;
    doc.text(secondary, pw / 2, y, { align: "center" });
    y += 8;
  }

  if (result.disintegration_direction) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(C.gray));
    doc.text(`Estressa como: ${result.disintegration_direction}`, pw / 2, y, { align: "center" });
    y += 8;
  }

  // Date
  doc.setFontSize(8);
  doc.setTextColor(...col(C.gray));
  doc.text(`Preenchido em: ${dateStr}`, pw / 2, ph - 16, { align: "center" });

  // ═══════════════════════════════════════════════════════════
  // PAGE 2: INTRODUCTION - O ENEAGRAMA
  // ═══════════════════════════════════════════════════════════
  if (level !== "basico") {
    newPage();
    headerLine();
    sectionBanner("A Jornada de Autoconhecimento");

    sectionTitle("Introdução");
    text(INTRO_TEXT, 9, C.darkPurple);
    separator();

    sectionTitle("Fundamentação e Abordagem");
    text(ORIGIN_TEXT, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE 3: NINE TYPES
  // ═══════════════════════════════════════════════════════════
  if (level !== "basico") {
    newPage();
    headerLine();
    sectionBanner("Os Nove Padrões de Personalidade");

    text("No centro deste sistema estão nove padrões de personalidade, cada um com uma essência única, moldada por motivações e medos profundos. Os padrões são agrupados em três centros: instintivo (8, 9, 1), emocional (2, 3, 4) e mental (5, 6, 7).", 9, C.darkPurple);

    for (const t of NINE_TYPES_TEXT) {
      bullet(t, C.darkPurple, C.gold);
    }

    separator();
    sectionTitle("Dinâmicas: Integração e Estresse");
    text(DYNAMICS_TEXT, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE: HEALTH LEVELS INTRO + PRACTICAL APPLICATION
  // ═══════════════════════════════════════════════════════════
  if (level === "completo") {
    newPage();
    headerLine();
    sectionBanner("Os Níveis de Saúde");
    text(HEALTH_INTRO_TEXT, 9, C.darkPurple);
    separator();
    sectionTitle("Aplicação Prática do Eneagrama");
    text(PRACTICAL_TEXT, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE: CHARTS
  // ═══════════════════════════════════════════════════════════
  newPage();
  headerLine();
  sectionBanner("GRÁFICOS");

  // Bar chart of top 3 types
  sectionTitle("PERFIS IDENTIFICADOS");

  const types: { name: string; pct: number; color: [number, number, number] }[] = [];
  if (result.type_1_pct > 0) types.push({ name: result.type_1_name, pct: result.type_1_pct, color: C.chartColors[0] });
  if (result.type_2_name && result.type_2_pct) types.push({ name: result.type_2_name, pct: result.type_2_pct, color: C.chartColors[1] });
  if (result.type_3_name && result.type_3_pct) types.push({ name: result.type_3_name, pct: result.type_3_pct, color: C.chartColors[2] });

  const barH = 12;
  const barGap = 5;
  const labelW = 55;
  const maxBarW = cw - labelW - 25;

  for (const t of types) {
    check(barH + barGap);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(C.darkPurple));
    doc.text(t.name, m, y + barH / 2 + 1);

    const barX = m + labelW;
    doc.setFillColor(...col(C.lightGray));
    doc.roundedRect(barX, y - 1, maxBarW, barH, 2, 2, "F");

    const barW = Math.max(2, (t.pct / 100) * maxBarW);
    doc.setFillColor(...t.color);
    doc.roundedRect(barX, y - 1, barW, barH, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(C.darkPurple));
    doc.text(`${t.pct}%`, barX + maxBarW + 3, y + barH / 2 + 1);

    y += barH + barGap;
  }
  y += 4;

  // Wing info
  if (result.wing) {
    separator();
    sectionTitle("PERFIL DOMINANTE | ASAS");
    field("Asa dominante:", result.wing);
  }

  // Subtypes
  if (result.subtype_preservation != null || result.subtype_social != null || result.subtype_sexual != null) {
    separator();
    sectionTitle("SUBTIPOS");
    if (result.subtype_preservation != null) field("Autopreservação:", `${result.subtype_preservation}%`);
    if (result.subtype_social != null) field("Social:", `${result.subtype_social}%`);
    if (result.subtype_sexual != null) field("Sexual:", `${result.subtype_sexual}%`);
  }

  // Health level
  if (result.health_level) {
    separator();
    sectionTitle("NÍVEL DE SAÚDE");
    const healthLabel = result.health_level <= 3 ? "Saudável" : result.health_level <= 6 ? "Médio" : "Não Saudável";
    field("Nível:", `${result.health_level}/9 (${healthLabel})`);
  }

  // Participant data
  separator();
  sectionTitle("DADOS DO PARTICIPANTE");
  field("Nome:", userName);
  if (phone) field("Telefone:", phone);
  field("Data:", dateStr);
  if (result.dominant_center) field("Centro:", result.dominant_center);
  if (result.tritype) field("Tritipo:", result.tritype);

  // ═══════════════════════════════════════════════════════════
  // 10 ANALYSIS SECTIONS (parsed from summary)
  // ═══════════════════════════════════════════════════════════
  if (result.summary && (level === "intermediario" || level === "completo")) {
    const parsedSections = parseSummaryIntoSections(result.summary);

    if (parsedSections.length > 0) {
      for (let i = 0; i < parsedSections.length; i++) {
        const sec = parsedSections[i];
        // For basico level, only show first 3 sections
        if (level === "intermediario" && i >= 5) break;

        check(40);
        separator();
        const sectionNum = String(i + 1).padStart(2, "0");
        sectionBanner(`${sectionNum}  ·  ${sec.title}`);
        const cleanContent = sec.content.replace(/[#*_`]/g, "");
        text(cleanContent, 9, C.darkPurple);
      }
    } else {
      // Fallback: render full summary if sections not parseable
      check(40);
      separator();
      sectionBanner("ANÁLISE COMPLETA");
      const cleanSummary = result.summary.replace(/[#*_`]/g, "");
      text(cleanSummary, 9, C.darkPurple);
    }
  }

  // Legacy AI-generated sections (kept for backward compat with old reports)
  const s = sections || {};
  if (!result.summary && s.perfil_dominante && (level === "intermediario" || level === "completo")) {
    separator();
    sectionBanner(`Seu Perfil Dominante: ${result.type_1_name}`);
    text(s.perfil_dominante, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // INSIGHTS & NOTES (blank page for user to write)
  // ═══════════════════════════════════════════════════════════
  if (level === "completo") {
    newPage();
    headerLine();
    sectionBanner("INSIGHTS E ANOTAÇÕES");
    text("Este espaço foi pensado para ser o seu refúgio de reflexões ao longo desta jornada de autoconhecimento. Use-o para registrar os insights mais marcantes que você descobriu sobre si mesmo, as reflexões que tocaram seu coração e as ideias que deseja levar adiante.", 9, C.gray);
    y += 4;
    // Draw lines for writing
    for (let i = 0; i < 14; i++) {
      check(8);
      doc.setDrawColor(...col(C.lightGray));
      doc.setLineWidth(0.2);
      doc.line(m, y, pw - m, y);
      y += 8;
    }
  }



  // ═══════════════════════════════════════════════════════════
  // BONUS: Relationship Tips (completo only)
  // ═══════════════════════════════════════════════════════════
  if (s.dicas_relacionamento?.length && level === "completo") {
    newPage();
    headerLine();
    sectionBanner("ÁREA BÔNUS");
    sectionTitle("Dicas de Relacionamento");
    text(`Como ${result.type_1_name}, veja como se conectar com cada tipo:`, 9, C.gray);
    y += 2;

    for (const dica of s.dicas_relacionamento) {
      check(8);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col(C.darkPurple));
      doc.text(`Com um ${dica.tipo}:`, m, y);
      y += 4;
      const lines = doc.splitTextToSize(dica.dica, cw - 5);
      doc.setFont("helvetica", "normal");
      for (const line of lines) {
        check(4);
        doc.text(line, m + 3, y);
        y += 4;
      }
      y += 2;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BONUS: Development suggestions (completo only)
  // ═══════════════════════════════════════════════════════════
  if (s.desenvolvimento?.length && level === "completo") {
    check(40);
    separator();
    sectionTitle(`Desenvolva-se como ${result.type_1_name}`);
    for (const sug of s.desenvolvimento) {
      bullet(sug, C.darkPurple, C.green);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BONUS: Resources (completo only)
  // ═══════════════════════════════════════════════════════════
  if (level === "completo") {
    newPage();
    headerLine();
    sectionBanner("ÁREA BÔNUS");
    sectionTitle("Aprofunde-se no Eneagrama");

    for (const res of RESOURCES_TEXT) {
      check(12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col(C.goldDark));
      doc.text(res.cat + ":", m, y);
      y += 5;
      for (const item of res.items) {
        bullet(item, C.darkPurple, C.gold);
      }
      y += 2;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LEGAL INFO (last page)
  // ═══════════════════════════════════════════════════════════
  newPage();
  headerLine();
  sectionBanner("INFORMAÇÕES LEGAIS");

  text("Desenvolvido por: Silvonei Sonntag Desenvolvimento Humano Ltda", 9, C.darkPurple, true);
  y += 2;

  sectionTitle("Aviso de Direitos Autorais");
  text("Este relatório é uma obra original protegida pela Lei de Direitos Autorais do Brasil (Lei nº 9.610/1998). © 2026 Silvonei Sonntag Desenvolvimento Humano. Todos os direitos são reservados. Não é permitida a reprodução, distribuição, compartilhamento, modificação ou uso comercial deste material, no todo ou em parte, sem autorização expressa e por escrito.", 8, C.gray);
  y += 2;

  sectionTitle("Uso do Material");
  text("O Relatório Personalizado de Eneagrama foi desenvolvido para fins de autoconhecimento e desenvolvimento pessoal. As informações aqui contidas não substituem aconselhamento profissional, como psicológico, médico ou jurídico. Utilize este material como uma ferramenta de apoio em sua jornada de crescimento.", 8, C.gray);
  y += 2;

  sectionTitle("Agradecimentos");
  text("Agradecemos por escolher este relatório para apoiar sua jornada de autoconhecimento. Esperamos que ele traga insights valiosos e contribua para o fortalecimento das suas relações e do seu crescimento pessoal.\n\nContinue explorando o poder do Eneagrama e transformando desafios em oportunidades!", 9, C.darkPurple);

  // ── Footer on last page ──
  const footerY = Math.max(y + 8, ph - 20);
  if (footerY <= ph - 10) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(C.gray));
    doc.text("Este relatório é apenas indicativo e não substitui avaliação profissional.", pw / 2, footerY, { align: "center" });
  }

  // Save
  const fileName = `mapa-interior-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`;

  if (returnBlob) {
    return doc.output("blob");
  }
  doc.save(fileName);
};

export const getPDFFileName = (result: PDFResult) => {
  const userName = result.profiles?.display_name || "Não informado";
  return `mapa-interior-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`;
};
