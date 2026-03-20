import jsPDF from "jspdf";

interface DashboardExportData {
  profileName: string;
  totalResults: number;
  uniqueClients: number;
  feedbackCount: number;
  avgRating: number;
  typeDistribution: { name: string; count: number }[];
  subtypeDistribution: { name: string; count: number }[];
  recentResults: { clientName: string; typeName: string; date: string }[];
}

export function exportDashboardCSV(data: DashboardExportData) {
  const lines: string[] = [];

  lines.push("=== Resumo do Dashboard ===");
  lines.push(`Gerado em,${new Date().toLocaleDateString("pt-BR")}`);
  lines.push(`Admin,${data.profileName}`);
  lines.push("");

  lines.push("=== KPIs ===");
  lines.push("Métrica,Valor");
  lines.push(`Relatórios Gerados,${data.totalResults}`);
  lines.push(`Clientes Atendidos,${data.uniqueClients}`);
  lines.push(`Feedbacks Recebidos,${data.feedbackCount}`);
  lines.push(`Nota Média,${data.avgRating > 0 ? data.avgRating.toFixed(1) : "N/A"}`);
  lines.push("");

  lines.push("=== Distribuição de Tipos ===");
  lines.push("Tipo,Quantidade");
  data.typeDistribution.forEach((t) => lines.push(`${t.name},${t.count}`));
  lines.push("");

  if (data.subtypeDistribution.length > 0) {
    lines.push("=== Distribuição de Subtipos ===");
    lines.push("Subtipo,Quantidade");
    data.subtypeDistribution.forEach((s) => lines.push(`${s.name},${s.count}`));
    lines.push("");
  }

  lines.push("=== Últimos Resultados ===");
  lines.push("Cliente,Tipo Dominante,Data");
  data.recentResults.forEach((r) => lines.push(`${r.clientName},${r.typeName},${r.date}`));

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `dashboard-${formatDateFile()}.csv`);
}

export function exportDashboardPDF(data: DashboardExportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const addTitle = (text: string) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(181, 131, 141);
    doc.text(text, 14, y);
    y += 8;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text(text, 14, y);
    y += 6;
  };

  const addRow = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(value, 90, y);
    y += 5.5;
  };

  const checkPage = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  addTitle("Relatório do Dashboard");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} • Admin: ${data.profileName}`, 14, y);
  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, y, pageW - 14, y);
  y += 10;

  // KPIs
  addSubtitle("Indicadores Principais");
  y += 2;
  addRow("Relatórios Gerados", String(data.totalResults));
  addRow("Clientes Atendidos", String(data.uniqueClients));
  addRow("Feedbacks Recebidos", String(data.feedbackCount));
  addRow("Nota Média", data.avgRating > 0 ? `${data.avgRating.toFixed(1)} / 5` : "N/A");
  y += 6;

  // Type distribution
  if (data.typeDistribution.length > 0) {
    checkPage(10 + data.typeDistribution.length * 5.5);
    addSubtitle("Distribuição de Tipos");
    y += 2;
    data.typeDistribution.forEach((t) => addRow(t.name, String(t.count)));
    y += 6;
  }

  // Subtype distribution
  if (data.subtypeDistribution.length > 0) {
    checkPage(10 + data.subtypeDistribution.length * 5.5);
    addSubtitle("Distribuição de Subtipos");
    y += 2;
    data.subtypeDistribution.forEach((s) => addRow(s.name, String(s.count)));
    y += 6;
  }

  // Recent results table
  if (data.recentResults.length > 0) {
    checkPage(10 + data.recentResults.length * 6);
    addSubtitle("Últimos Resultados");
    y += 2;

    // Table header
    doc.setFillColor(243, 244, 246);
    doc.rect(14, y - 3, pageW - 28, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("CLIENTE", 16, y);
    doc.text("TIPO DOMINANTE", 80, y);
    doc.text("DATA", 150, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    data.recentResults.forEach((r) => {
      doc.setFontSize(9);
      doc.text(r.clientName, 16, y);
      doc.text(r.typeName, 80, y);
      doc.text(r.date, 150, y);
      y += 5.5;
    });
  }

  doc.save(`dashboard-${formatDateFile()}.pdf`);
}

function formatDateFile() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
