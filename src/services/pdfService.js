const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

function formatCurrencyBr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDateBr(value) {
  if (!value) return "-";
  const [yyyy, mm, dd] = String(value).split("-");
  if (!yyyy || !mm || !dd) return value;
  return `${dd}/${mm}/${yyyy}`;
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
  const localFallback = path.resolve(__dirname, "../../../frontend/public/logo.png");
  if (fs.existsSync(localFallback)) return localFallback;
  return null;
}

function drawHeader(doc, osData, office) {
  const marginX = 44;
  const top = 36;
  const logoPath = resolveLogoPath();

  if (logoPath) {
    doc
      .roundedRect(marginX, top, 56, 56, 14)
      .fillOpacity(0.08)
      .fill("#2563EB")
      .fillOpacity(1)
      .image(logoPath, marginX + 8, top + 8, { width: 40, height: 40 });
  } else {
    doc.roundedRect(marginX, top, 56, 56, 14).fill("#1E293B");
    doc.fillColor("#93C5FD").font("Helvetica-Bold").fontSize(18).text("OS", marginX + 14, top + 19);
  }

  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(18).text(office.nome, marginX + 70, top + 4);
  doc
    .fillColor("#475569")
    .font("Helvetica")
    .fontSize(10)
    .text(`Tel: ${office.telefone}`, marginX + 70, top + 28)
    .text(`E-mail: ${office.email}`, marginX + 70, top + 42)
    .text(`Endereco: ${office.endereco}`, marginX + 70, top + 56, { width: 330 });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Ordem de Servico", 420, top + 10, { align: "right", width: 130 });

  doc
    .fillColor("#334155")
    .font("Helvetica")
    .fontSize(10)
    .text(`OS: ${osData.id_os}`, 420, top + 40, { align: "right", width: 130 })
    .text(`Status: ${osData.status}`, 420, top + 54, { align: "right", width: 130 });

  doc.moveTo(44, 106).lineTo(551, 106).strokeColor("#E2E8F0").stroke();
}

function drawInfoGrid(doc, startY, osData) {
  const x = 44;
  const width = 507;
  const rowGap = 10;

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text("Dados da Ordem", x, startY);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`Data entrada: ${formatDateBr(osData.data_entrada)}`, x, startY + 16)
    .text(`Data saida: ${formatDateBr(osData.data_saida)}`, x + 180, startY + 16)
    .text(`Status: ${osData.status}`, x + 340, startY + 16);

  const yCliente = startY + 40;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text("Cliente", x, yCliente);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`Nome: ${osData.cliente?.nome || "-"}`, x, yCliente + 16, { width: width })
    .text(`Telefone: ${osData.cliente?.telefone || "-"}`, x, yCliente + 30)
    .text(`CPF: ${osData.cliente?.cpf || "-"}`, x + 180, yCliente + 30)
    .text(`E-mail: ${osData.cliente?.email || "-"}`, x + 320, yCliente + 30);

  const yVeiculo = yCliente + 56 + rowGap;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text("Veiculo", x, yVeiculo);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`Placa: ${osData.veiculo?.placa || "-"}`, x, yVeiculo + 16)
    .text(`Modelo: ${osData.veiculo?.modelo || "-"}`, x + 120, yVeiculo + 16)
    .text(`Marca: ${osData.veiculo?.marca || "-"}`, x + 300, yVeiculo + 16)
    .text(`Ano: ${osData.veiculo?.ano || "-"}`, x, yVeiculo + 30)
    .text(`Cor: ${osData.veiculo?.cor || "-"}`, x + 120, yVeiculo + 30)
    .text(`KM: ${osData.veiculo?.km_atual || "-"}`, x + 220, yVeiculo + 30);

  const yServico = yVeiculo + 56 + rowGap;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text("Servico", x, yServico);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`Problema relatado: ${osData.problema_relatado || "-"}`, x, yServico + 16, { width })
    .text(`Diagnostico: ${osData.diagnostico || "-"}`, x, yServico + 44, { width })
    .text(`Observacoes: ${osData.observacoes || "-"}`, x, yServico + 72, { width });

  return yServico + 106;
}

function drawItemsTable(doc, startY, itens = []) {
  const tableX = 44;
  const tableW = 507;
  const cols = [70, 215, 62, 80, 80];
  const headers = ["Tipo", "Descricao", "Qtd.", "Unit.", "Subtotal"];
  const rowHeight = 24;

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A").text("Itens da OS", tableX, startY);
  let y = startY + 14;

  doc.roundedRect(tableX, y, tableW, rowHeight, 6).fill("#F8FAFC");
  let cursorX = tableX + 8;
  headers.forEach((h, idx) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text(h, cursorX, y + 8, { width: cols[idx] - 4 });
    cursorX += cols[idx];
  });

  y += rowHeight;

  if (!itens.length) {
    doc.rect(tableX, y, tableW, rowHeight).strokeColor("#E2E8F0").stroke();
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Sem itens cadastrados", tableX + 8, y + 8);
    y += rowHeight;
    return y + 8;
  }

  itens.forEach((item) => {
    doc.rect(tableX, y, tableW, rowHeight).strokeColor("#E2E8F0").stroke();
    const values = [
      item.tipo_item || "-",
      item.descricao || "-",
      item.quantidade || "0",
      formatCurrencyBr(item.valor_unitario),
      formatCurrencyBr(item.subtotal),
    ];
    let valueX = tableX + 8;
    values.forEach((value, idx) => {
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(String(value), valueX, y + 8, { width: cols[idx] - 4 });
      valueX += cols[idx];
    });
    y += rowHeight;
  });

  return y + 8;
}

function drawTotals(doc, startY, osData) {
  const x = 330;
  const w = 221;

  doc.roundedRect(x, startY, w, 66, 8).fill("#F8FAFC");
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`Total pecas: ${formatCurrencyBr(osData.valor_pecas)}`, x + 10, startY + 12)
    .text(`Total mao de obra: ${formatCurrencyBr(osData.valor_mao_obra)}`, x + 10, startY + 28)
    .font("Helvetica-Bold")
    .fillColor("#0F172A")
    .text(`Total geral: ${formatCurrencyBr(osData.valor_total)}`, x + 10, startY + 46);

  return startY + 88;
}

function drawFooter(doc, startY) {
  const y = Math.max(startY, 720);
  const sigW = 200;

  doc.moveTo(64, y).lineTo(64 + sigW, y).strokeColor("#94A3B8").stroke();
  doc.moveTo(340, y).lineTo(340 + sigW, y).strokeColor("#94A3B8").stroke();

  doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Assinatura do cliente", 64, y + 6);
  doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Assinatura da oficina", 340, y + 6);

  doc
    .font("Helvetica-Oblique")
    .fontSize(10)
    .fillColor("#334155")
    .text("Agradecemos pela preferencia.", 44, y + 28, { width: 507, align: "center" });
}

function generateOsPdfStream(osData) {
  const doc = new PDFDocument({ size: "A4", margin: 44 });
  const office = getOfficeProfile();

  drawHeader(doc, osData, office);
  const afterInfo = drawInfoGrid(doc, 120, osData);
  const afterItems = drawItemsTable(doc, afterInfo, osData.itens || []);
  const afterTotals = drawTotals(doc, afterItems, osData);
  drawFooter(doc, afterTotals);

  doc.end();
  return doc;
}

function gerarPdfOrdemServico(res, dados, options = {}) {
  const isDownload = options.download === true || options.download === "1";
  const friendlyId = dados.id_os || "ordem-servico";
  const fileName = `os-${friendlyId}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${isDownload ? "attachment" : "inline"}; filename=\"${fileName}\"`);

  const doc = generateOsPdfStream(dados);
  doc.pipe(res);
}

module.exports = {
  generateOsPdfStream,
  gerarPdfOrdemServico,
};
