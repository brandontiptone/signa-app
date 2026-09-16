const PDFDocument = require('pdfkit');

// Génère le PDF d'une facture et le renvoie sous forme de Buffer
function genererFacturePdf(facture, organisation) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // En-tête
    doc.fontSize(22).fillColor('#FF6B4A').text('Signa', 50, 50);
    doc.fontSize(10).fillColor('#666').text('Facture de location — application Signa', 50, 78);

    doc.fontSize(16).fillColor('#1B2340').text(`Facture ${facture.numero}`, 50, 120);
    doc.fontSize(10).fillColor('#666')
      .text(`Période : ${facture.periode}`, 50, 145)
      .text(`Date d'échéance : ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`, 50, 160)
      .text(`Statut : ${facture.statut === 'PAYEE' ? 'Payée' : 'Impayée'}`, 50, 175);

    doc.fontSize(12).fillColor('#1B2340').text('Facturé à :', 50, 210);
    doc.fontSize(11).fillColor('#333').text(organisation.nom, 50, 228);

    // Tableau simple
    const tableTop = 280;
    doc.fontSize(10).fillColor('#888')
      .text('Description', 50, tableTop)
      .text('Montant', 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#eee').stroke();

    doc.fontSize(11).fillColor('#1B2340')
      .text(`Abonnement Signa — ${facture.periode}`, 50, tableTop + 25)
      .text(`${facture.montant.toFixed(2)} €`, 450, tableTop + 25);

    doc.moveTo(50, tableTop + 55).lineTo(545, tableTop + 55).strokeColor('#eee').stroke();
    doc.fontSize(13).fillColor('#1B2340').text('Total TTC', 350, tableTop + 70)
      .text(`${facture.montant.toFixed(2)} €`, 450, tableTop + 70);

    doc.fontSize(9).fillColor('#999').text(
      'Facture générée automatiquement par Signa.',
      50, 720, { width: 500 }
    );

    doc.end();
  });
}

module.exports = { genererFacturePdf };
