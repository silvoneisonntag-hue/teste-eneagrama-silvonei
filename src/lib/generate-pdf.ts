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

// Color palette inspired by the reference model
const C = {
  white: [255, 255, 255] as const,
  darkPurple: [35, 20, 60] as const,
  purple: [60, 35, 100] as const,
  purpleLight: [100, 70, 150] as const,
  gold: [180, 140, 40] as const,
  goldDark: [150, 110, 15] as const,
  goldBg: [245, 235, 210] as const,
  gray: [120, 110, 130] as const,
  lightGray: [230, 225, 235] as const,
  green: [40, 140, 90] as const,
  orange: [200, 120, 30] as const,
  blue: [60, 100, 180] as const,
  red: [180, 50, 50] as const,
  chartColors: [
    [60, 35, 100],    // purple
    [60, 100, 180],   // blue
    [40, 140, 90],    // green
    [200, 120, 30],   // orange
    [180, 50, 50],    // red
    [150, 110, 15],   // gold
    [100, 70, 150],   // light purple
    [70, 130, 170],   // teal
    [180, 100, 120],  // pink
  ] as [number, number, number][],
};

type Color = readonly [number, number, number];

// Fixed introductory texts (similar to reference model)
const INTRO_TEXT = `Bem-vindo à Sua Jornada com o Eneagrama!\n\nVocê já se perguntou o que realmente motiva suas escolhas e comportamentos? O Eneagrama é uma ferramenta poderosa que combina sabedoria antiga e psicologia moderna para responder a essa pergunta, oferecendo uma jornada única de autoconhecimento e crescimento pessoal. Diferente de outros sistemas, o Eneagrama vai além de traços superficiais, revelando as motivações profundas, os medos centrais e os padrões que moldam quem você é e como se relaciona com o mundo.\n\nRepresentado por um símbolo de nove pontos interconectados, ele reflete a riqueza e a complexidade da personalidade humana. Este relatório, criado com base nas suas respostas, traz uma análise personalizada para ajudá-lo a se entender melhor, com insights práticos que podem transformar sua vida.`;

const ORIGIN_TEXT = `O Eneagrama tem raízes profundas que remontam a tradições antigas, com influências de diversas culturas, como o misticismo sufi e a filosofia pitagórica. No início do século XX, o símbolo foi introduzido no Ocidente por G.I. Gurdjieff como uma ferramenta para o desenvolvimento da consciência.\n\nMas foi na segunda metade do século que o Eneagrama ganhou sua forma moderna, graças a pensadores como Oscar Ichazo, que o conectou à psicologia, e Claudio Naranjo, que explorou os padrões emocionais de cada tipo. Mais tarde, autores como Don Richard Riso e Russ Hudson popularizaram o sistema com o livro The Wisdom of the Enneagram, trazendo conceitos como os níveis de saúde e as dinâmicas de crescimento. Hoje, o Eneagrama é uma ferramenta global para o autoconhecimento, usada por milhões de pessoas para entenderem melhor a si mesmas e aos outros.`;

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

const DYNAMICS_TEXT = `O Eneagrama é um sistema dinâmico, e suas conexões mostram como sua personalidade pode evoluir e se transformar. As asas são os tipos ao lado do seu, que adicionam nuances ao seu perfil. As direções de integração e estresse mostram como você cresce ou enfrenta desafios.\n\nQuando está em crescimento (integração), você adota qualidades positivas de outro tipo; sob pressão (estresse), pode manifestar comportamentos mais difíceis de um tipo diferente.`;

const HEALTH_INTRO_TEXT = `Um dos conceitos mais poderosos do Eneagrama é o de Níveis de Saúde, que mostra como você está vivendo suas qualidades e enfrentando seus desafios:\n\n• Saudável: Suas melhores qualidades brilham naturalmente, inspirando você e quem está ao seu redor.\n• Médio: Um momento de equilíbrio, onde você está crescendo. Suas forças estão presentes, mas desafios podem surgir.\n• Não Saudável: Um ponto em que os desafios pesam mais, mas este é também um convite para se reconectar com sua essência.`;

const PRACTICAL_TEXT = `O Eneagrama não é apenas teoria — é uma ferramenta prática que você pode usar para transformar sua vida. Ele é amplamente aplicado em áreas como coaching, terapia, liderança e até na vida cotidiana, ajudando a identificar pontos cegos e a encontrar caminhos para o crescimento.\n\nCom este relatório, você terá insights práticos para aplicar o Eneagrama no seu dia a dia, seja para tomar decisões mais conscientes, fortalecer conexões ou alcançar seus objetivos com mais clareza.`;

const RESOURCES_TEXT = [
  { cat: "Livros", items: ["A Sabedoria do Eneagrama — Don Richard Riso e Russ Hudson", "O Caminho do Eneagrama — Beatrice Chestnut"] },
  { cat: "Sites", items: ["The Enneagram Institute (enneagraminstitute.com)", "Integrative 9 (integrative9.com)"] },
  { cat: "Podcasts", items: ["The Enneagram Journey", "Typology — por Ian Morgan Cron"] },
];

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
    doc.text(`Relatório Eneagrama: ${name}`, m, 10);
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
  centeredText("Relatório Eneagrama", 26, C.gold);
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
  doc.text("Tipo Dominante", pw / 2, y + 4, { align: "center" });
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
    sectionBanner("O Eneagrama");

    sectionTitle("Introdução");
    text(INTRO_TEXT, 9, C.darkPurple);
    separator();

    sectionTitle("Origem e Evolução");
    text(ORIGIN_TEXT, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE 3: NINE TYPES
  // ═══════════════════════════════════════════════════════════
  if (level !== "basico") {
    newPage();
    headerLine();
    sectionBanner("Os Nove Tipos de Personalidade");

    text("No centro do Eneagrama estão os nove tipos de personalidade, cada um com uma essência única, moldada por motivações e medos profundos. Os tipos são agrupados em três centros: instintivo (Tipos 8, 9, 1), emocional (Tipos 2, 3, 4) e mental (Tipos 5, 6, 7).", 9, C.darkPurple);

    for (const t of NINE_TYPES_TEXT) {
      bullet(t, C.darkPurple, C.gold);
    }

    separator();
    sectionTitle("Dinâmicas: Asas, Integração e Estresse");
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
  sectionTitle("PERFIS ENEAGRAMA");

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
  // AI-GENERATED SECTIONS (intermediário + completo)
  // ═══════════════════════════════════════════════════════════
  const s = sections || {};

  // Dominant Profile
  if (s.perfil_dominante && (level === "intermediario" || level === "completo")) {
    check(40);
    separator();
    sectionBanner(`Seu Perfil Dominante: ${result.type_1_name}`);
    text(s.perfil_dominante, 9, C.darkPurple);
  }

  // Characteristics
  if (s.caracteristicas && (level === "intermediario" || level === "completo")) {
    separator();
    sectionTitle(`Características Principais: ${result.type_1_name}`);
    text(s.caracteristicas, 9, C.darkPurple);
  }

  // Motivations & Fears (completo only)
  if (s.motivacoes_medos && level === "completo") {
    check(40);
    separator();
    sectionBanner(`Motivações e Medos: ${result.type_1_name}`);
    text(s.motivacoes_medos, 9, C.darkPurple);
  }

  // Behaviors (completo only)
  if (s.comportamentos && level === "completo") {
    separator();
    sectionTitle(`Comportamentos: ${result.type_1_name}`);
    text(s.comportamentos, 9, C.darkPurple);
  }

  // Team & Conflicts (completo only)
  if (s.equipe_conflitos && level === "completo") {
    check(40);
    separator();
    sectionBanner(`Como age em equipe e lida com conflitos`);
    text(s.equipe_conflitos, 9, C.darkPurple);
  }

  // Wings influence (completo only)
  if (s.influencia_asas && level === "completo") {
    check(40);
    separator();
    sectionBanner(`Influência das Asas no perfil ${result.type_1_name}`);
    text(s.influencia_asas, 9, C.darkPurple);
  }

  // Secondary profile influence (completo only)
  if (s.influencia_secundario && level === "completo" && result.type_2_name) {
    separator();
    sectionTitle(`Influência do Perfil Secundário: ${result.type_2_name}`);
    text(s.influencia_secundario, 9, C.darkPurple);
  }

  // Integration (completo only)
  if (s.integracao && level === "completo") {
    check(40);
    separator();
    sectionBanner(`Pontos de Integração: ${result.type_1_name}`);
    if (result.integration_direction) {
      text(`Integra com: ${result.integration_direction}`, 10, C.green, true);
    }
    text(s.integracao, 9, C.darkPurple);
  }

  // Stress (completo only)
  if (s.estresse && level === "completo") {
    newPage();
    headerLine();
    sectionBanner(`Pontos de Estresse: ${result.type_1_name}`);
    if (result.disintegration_direction) {
      text(`Estressa como: ${result.disintegration_direction}`, 10, C.red, true);
      y += 2;
    }
    text(s.estresse, 9, C.darkPurple);
  }

  // Health Level detail
  if (s.nivel_saude && (level === "intermediario" || level === "completo")) {
    newPage();
    headerLine();
    sectionBanner(`Nível de Saúde: ${result.type_1_name}`);
    text(s.nivel_saude, 9, C.darkPurple);
  }

  // Skills
  if (s.habilidades_naturais?.length && (level === "intermediario" || level === "completo")) {
    separator();
    sectionTitle("HABILIDADES NATURAIS");
    for (const skill of s.habilidades_naturais) {
      bullet(skill, C.darkPurple, C.green);
    }
    y += 2;
  }

  if (s.habilidades_desenvolver?.length && (level === "intermediario" || level === "completo")) {
    separator();
    sectionTitle("HABILIDADES A DESENVOLVER");
    for (const skill of s.habilidades_desenvolver) {
      bullet(skill, C.darkPurple, C.orange);
    }
    y += 2;
  }

  // Reflection questions (completo only)
  if (s.reflexao?.length && level === "completo") {
    newPage();
    headerLine();
    sectionBanner("REFLITA UM POUCO");
    text(`Como ${result.type_1_name.split(" - ")[0] || result.type_1_name}, estas perguntas o convidarão a explorar sua jornada:`, 9, C.gray);
    y += 2;
    for (const q of s.reflexao) {
      bullet(q, C.darkPurple, C.purple);
    }
  }

  // Full analysis from summary (completo only)
  if (result.summary && level === "completo") {
    newPage();
    headerLine();
    sectionBanner("ANÁLISE COMPLETA");
    const cleanSummary = result.summary.replace(/[#*_`]/g, "");
    text(cleanSummary, 9, C.darkPurple);
  }

  // ═══════════════════════════════════════════════════════════
  // INSIGHTS & NOTES (blank page for user to write)
  // ═══════════════════════════════════════════════════════════
  if (level === "completo") {
    newPage();
    headerLine();
    sectionBanner("INSIGHTS E ANOTAÇÕES");
    text("Este espaço foi pensado para ser o seu refúgio de reflexões ao longo desta jornada de autoconhecimento. Use-o para registrar os insights mais marcantes que você descobriu sobre si mesmo, as reflexões que tocaram seu coração e as ideias que deseja levar adiante.", 9, C.gray);
    y += 6;
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
  // ACTION PLAN (blank page)
  // ═══════════════════════════════════════════════════════════
  if (level === "completo") {
    newPage();
    headerLine();
    sectionBanner("PLANO DE AÇÃO");
    text("O relatório que está em suas mãos é uma ferramenta que irá ajudá-lo(a) a evoluir e conquistar seus objetivos. Aproveite as próximas linhas para criar suas ações e prazos.", 9, C.gray);
    y += 4;

    for (let i = 1; i <= 3; i++) {
      check(30);
      sectionTitle(`Ação ${i}`);
      field("Motivo da Ação:", "");
      y += 4;
      doc.setDrawColor(...col(C.lightGray));
      doc.line(m + 50, y - 4, pw - m, y - 4);
      field("Prazo:", "");
      y += 2;
      doc.line(m + 50, y - 2, pw - m, y - 2);
      y += 4;
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
