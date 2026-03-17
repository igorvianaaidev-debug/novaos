const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const COLORS = {
  ink: "#0F172A",
  muted: "#475569",
  border: "#E2E8F0",
  panel: "#F8FAFC",
  brand: "#2563EB",
  brandSoft: "#DBEAFE",
  successSoft: "#DCFCE7",
  successText: "#166534",
  warningSoft: "#FEF3C7",
  warningText: "#92400E",
  progressSoft: "#DBEAFE",
  progressText: "#1D4ED8",
};

function formatCurrencyBr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDateBr(value) {
  if (!value) return "-";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  return raw;
}

function safe(v) {
  if (v === undefined || v === null || String(v).trim() === "") return "-";
  return String(v);
}

function getOfficeProfile() {
  return {
    nome: process.env.OFICINA_NOME || "Oficina OS",
    telefone: process.env.OFICINA_TELEFONE || "(00) 00000-0000",
    email: process.env.OFICINA_EMAIL || "contato@oficinaos.com",
    endereco: process.env.OFICINA_ENDERECO || "Endereco da oficina",
  };
}

function resolveLogoPath() {
  const fromEnv = process.env.PDF_LOGO_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const fallbackPng = path.resolve(__dirname, "../../../frontend/public/logo.png");
  if (fs.existsSync(fallbackPng)) return fallbackPng;

  return null;
}

function drawRoundedPanel(doc, x, y, w, h, fill = COLORS.panel) {
  doc.roundedRect(x, y, w, h, 8).fill(fill);
}

function statusPillColors(status) {
  if (status === "Finalizado") return { bg: COLORS.successSoft, text: COLORS.successText };
  if (status === "Em andamento") return { bg: COLORS.progressSoft, text: COLORS.progressText };
  return { bg: COLORS.warningSoft, text: COLORS.warningText };
}

function drawHeader(doc, office, osData) {
  const x = 44;
  const y = 32;
  const w = 507;
  const logoPath = resolveLogoPath();

  drawRoundedPanel(doc, x, y, w, 88, "#FFFFFF");
  doc.roundedRect(x, y, w, 88, 8).lineWidth(1).strokeColor(COLORS.border).stroke();

  if (logoPath) {
    drawRoundedPanel(doc, x + 12, y + 12, 56, 56, COLORS.panel);
    doc.image(logoPath, x + 20, y + 20, { fit: [40, 40], align: "center", valign: "center" });
  } else {
    drawRoundedPanel(doc, x + 12, y + 12, 56, 56, "#0B1220");
    doc.fillColor("#93C5FD").font("Helvetica-Bold").fontSize(18).text("OS", x + 29, y + 32);
  }

  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(16).text(office.nome, x + 78, y + 15);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(`Telefone: ${safe(office.telefone)}`, x + 78, y + 37)
    .text(`E-mail: ${safe(office.email)}`, x + 78, y + 51)
    .text(`Endereco: ${safe(office.endereco)}`, x + 78, y + 65, { width: 285 });

  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(20).text("Ordem de Servico", x + 352, y + 18, {
    align: "right",
    width: 140,
  });

  const statusColors = statusPillColors(osData.status);
  drawRoundedPanel(doc, x + 430, y + 54, 64, 20, statusColors.bg);
  doc
    .fillColor(statusColors.text)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(safe(osData.status), x + 432, y + 60, { width: 60, align: "center" });
}

function drawSectionTitle(doc, title, x, y) {
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(12).text(title, x, y);
}

function drawKeyValueLine(doc, label, value, x, y, width) {
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text(`${label}: ${safe(value)}`, x, y, { width });
}

function drawOrderMeta(doc, osData, y) {
  const x = 44;
  drawRoundedPanel(doc, x, y, 507, 46);
  drawSectionTitle(doc, "Dados da OS", x + 10, y + 8);
  drawKeyValueLine(doc, "Numero", osData.id_os, x + 10, y + 24, 180);
  drawKeyValueLine(doc, "Entrada", formatDateBr(osData.data_entrada), x + 180, y + 24, 120);
  drawKeyValueLine(doc, "Saida", formatDateBr(osData.data_saida), x + 300, y + 24, 120);
  drawKeyValueLine(doc, "Status", osData.status, x + 410, y + 24, 90);
  return y + 56;
}

function drawPeopleAndVehicle(doc, osData, y) {
  const x = 44;
  drawRoundedPanel(doc, x, y, 507, 140);
  drawSectionTitle(doc, "Cliente", x + 10, y + 10);
  drawKeyValueLine(doc, "Nome", osData.cliente?.nome, x + 10, y + 28, 250);
  drawKeyValueLine(doc, "Telefone", osData.cliente?.telefone, x + 10, y + 44, 250);
  drawKeyValueLine(doc, "CPF", osData.cliente?.cpf, x + 10, y + 60, 250);
  drawKeyValueLine(doc, "E-mail", osData.cliente?.email, x + 10, y + 76, 250);

  doc.moveTo(x + 255, y + 10).lineTo(x + 255, y + 128).strokeColor(COLORS.border).stroke();

  drawSectionTitle(doc, "Veiculo", x + 270, y + 10);
  drawKeyValueLine(doc, "Placa", osData.veiculo?.placa, x + 270, y + 28, 230);
  drawKeyValueLine(doc, "Modelo", osData.veiculo?.modelo, x + 270, y + 44, 230);
  drawKeyValueLine(doc, "Marca", osData.veiculo?.marca, x + 270, y + 60, 230);
  drawKeyValueLine(doc, "Ano", osData.veiculo?.ano, x + 270, y + 76, 120);
  drawKeyValueLine(doc, "Cor", osData.veiculo?.cor, x + 350, y + 76, 150);
  drawKeyValueLine(doc, "KM", osData.veiculo?.km_atual, x + 270, y + 92, 230);

  return y + 150;
}

function drawServiceInfo(doc, osData, y) {
  const x = 44;
  drawRoundedPanel(doc, x, y, 507, 92);
  drawSectionTitle(doc, "Servico", x + 10, y + 10);
  drawKeyValueLine(doc, "Problema relatado", osData.problema_relatado, x + 10, y + 28, 487);
  drawKeyValueLine(doc, "Diagnostico", osData.diagnostico, x + 10, y + 46, 487);
  drawKeyValueLine(doc, "Observacoes", osData.observacoes, x + 10, y + 64, 487);
  return y + 102;
}

function drawTableHeader(doc, x, y, colWidths) {
  const headers = ["Tipo", "Descricao", "Qtd.", "Valor Unit.", "Subtotal"];
  drawRoundedPanel(doc, x, y, 507, 24, "#EEF2FF");
  let cursor = x + 8;
  headers.forEach((header, i) => {
    doc.fillColor("#1E3A8A").font("Helvetica-Bold").fontSize(9).text(header, cursor, y + 8, {
      width: colWidths[i] - 5,
      align: i >= 2 ? "right" : "left",
    });
    cursor += colWidths[i];
  });
}

function drawItemsTable(doc, itens, yStart) {
  const x = 44;
  const colWidths = [78, 219, 50, 80, 80];
  const rowH = 22;
  let y = yStart;

  drawSectionTitle(doc, "Itens da OS", x, y);
  y += 14;

  drawTableHeader(doc, x, y, colWidths);
  y += 24;

  if (!itens || itens.length === 0) {
    doc.rect(x, y, 507, rowH).strokeColor(COLORS.border).stroke();
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("Sem itens cadastrados.", x + 8, y + 7);
    return y + rowH + 10;
  }

  itens.forEach((item, index) => {
    const zebra = index % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    drawRoundedPanel(doc, x, y, 507, rowH, zebra);
    doc.rect(x, y, 507, rowH).strokeColor(COLORS.border).stroke();

    const values = [
      safe(item.tipo_item),
      safe(item.descricao),
      safe(item.quantidade),
      formatCurrencyBr(item.valor_unitario),
      formatCurrencyBr(item.subtotal),
    ];

    let cursor = x + 8;
    values.forEach((val, i) => {
      doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text(val, cursor, y + 7, {
        width: colWidths[i] - 5,
        align: i >= 2 ? "right" : "left",
      });
      cursor += colWidths[i];
    });
    y += rowH;
  });

  return y + 10;
}

function drawTotals(doc, osData, y) {
  const x = 330;
  const w = 221;
  drawRoundedPanel(doc, x, y, w, 74, "#ECFEFF");

  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text(`Total pecas: ${formatCurrencyBr(osData.valor_pecas)}`, x + 10, y + 14);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(`Total servicos: ${formatCurrencyBr(osData.valor_mao_obra)}`, x + 10, y + 32);
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Total geral: ${formatCurrencyBr(osData.valor_total)}`, x + 10, y + 52);

  return y + 86;
}

function drawFooter(doc, yStart) {
  const y = Math.max(yStart, 730);
  const leftX = 64;
  const rightX = 338;
  const width = 195;

  doc.moveTo(leftX, y).lineTo(leftX + width, y).strokeColor("#94A3B8").stroke();
  doc.moveTo(rightX, y).lineTo(rightX + width, y).strokeColor("#94A3B8").stroke();

  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("Assinatura do cliente", leftX, y + 6);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("Assinatura da oficina", rightX, y + 6);

  doc
    .fillColor("#334155")
    .font("Helvetica-Oblique")
    .fontSize(10)
    .text("Agradecemos pela preferencia.", 44, y + 28, { width: 507, align: "center" });
}

function generateOsPdfStream(osData) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
  });

  const office = getOfficeProfile();
  drawHeader(doc, office, osData);
  let cursorY = 132;
  cursorY = drawOrderMeta(doc, osData, cursorY);
  cursorY = drawPeopleAndVehicle(doc, osData, cursorY);
  cursorY = drawServiceInfo(doc, osData, cursorY);
  cursorY = drawItemsTable(doc, osData.itens || [], cursorY);
  cursorY = drawTotals(doc, osData, cursorY);
  drawFooter(doc, cursorY);

  doc.end();
  return doc;
}

function gerarPdfOrdemServico(res, dados, options = {}) {
  const isDownload = options.download === true || options.download === "1";
  const fileName = `os-${safe(dados.id_os)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${isDownload ? "attachment" : "inline"}; filename=\"${fileName}\"`);

  const doc = generateOsPdfStream(dados);
  doc.pipe(res);
}

module.exports = {
  generateOsPdfStream,
  gerarPdfOrdemServico,
};
