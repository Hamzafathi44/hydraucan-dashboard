import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateMapImage } from './srmMapGenerator';

const drawCheckbox = (page, isChecked, cx, rawY) => {
  if (isChecked) {
    const pageHeight = page.getHeight();
    const exactBaselineY = pageHeight - rawY - 0.18;
    page.drawText('X', { x: cx, y: exactBaselineY, size: 14, color: rgb(0, 0, 0) });
  }
};

const drawRightCheckbox = (page, isChecked, cx, rawY) => {
  if (isChecked) {
    const pageHeight = page.getHeight();
    const exactBaselineY = pageHeight - rawY + 0.90;
    page.drawText('X', { x: cx, y: exactBaselineY, size: 14, color: rgb(0, 0, 0) });
  }
};

const drawTypeFuiteCheckbox = (page, isChecked, cx, rawY) => {
  if (isChecked) {
    const pageHeight = page.getHeight();
    const exactBaselineY = pageHeight - rawY - 3.41;
    page.drawText('X', { x: cx, y: exactBaselineY, size: 14, color: rgb(0, 0, 0) });
  }
};

const drawVisAutresCheckbox = (page, isChecked, cx, rawY) => {
  if (isChecked) {
    const pageHeight = page.getHeight();
    const exactBaselineY = pageHeight - rawY - 2.63;
    page.drawText('X', { x: cx, y: exactBaselineY, size: 14, color: rgb(0, 0, 0) });
  }
};

const drawOrigineCheckbox = (page, isChecked, cx, rawY) => {
  if (isChecked) {
    const pageHeight = page.getHeight();
    const exactBaselineY = pageHeight - rawY - 0.86;
    page.drawText('X', { x: cx, y: exactBaselineY, size: 14, color: rgb(0, 0, 0) });
  }
};

const drawText = (page, text, cx, rawY, font) => {
  if (text !== undefined && text !== null && text !== '') {
    const pageHeight = page.getHeight();
    const y = pageHeight - rawY;
    const textOptions = { x: cx, y: y, size: 10, color: rgb(0, 0, 0) };
    if (font) textOptions.font = font;
    page.drawText(String(text), textOptions);
  }
};

export const mapItemToSrmForm = (item) => {
  const t = item.type?.toLowerCase() || '';
  const n = item.nature?.toLowerCase() || '';
  const m = item.material?.toLowerCase() || '';
  
  const isFuite = t.includes('fuite');
  const isRnvl = t.includes('rnvl') || t.includes('renouvellement');
  
  let obs1Text = item.type || '';
  if (isFuite) obs1Text = 'Fuite';
  if (isRnvl) obs1Text = 'RNVL';
  
  let mat1Text = item.material || '';
  let mat2Text = item.mat2 || '';

  if (mat1Text.length > 120 && !item.mat2) {
     const splitIndex = mat1Text.indexOf(' + ', 100) !== -1 ? mat1Text.indexOf(' + ', 100) : 
                        mat1Text.indexOf('] ') !== -1 ? mat1Text.indexOf('] ') + 1 : 
                        mat1Text.lastIndexOf(' ', 120);
     if (splitIndex !== -1 && splitIndex > 60) {
         mat2Text = mat1Text.substring(splitIndex).trim();
         if (mat2Text.startsWith('+ ')) mat2Text = mat2Text.substring(2);
         mat1Text = mat1Text.substring(0, splitIndex).trim();
     } else {
         mat2Text = mat1Text.substring(120);
         mat1Text = mat1Text.substring(0, 120);
     }
  }

  const defaults = {
    date: item.date || '',
    nCompteur: item.reference || '',
    adresse: '',
    x: '', y: '', mapType: item.mapType || 'Normal',
    estimation: '',
    obs1: obs1Text,
    obs2: '',
    mat1: mat1Text,
    mat2: mat2Text,
    
    mat_pvc: m.includes('pvc'),
    mat_pe: m.includes('pe'),
    mat_ac: m.includes('ac') && !m.includes('faience'),
    mat_fd: m.includes('fd') || m.includes('fonte ductile'),
    mat_fg: m.includes('fg') || m.includes('fonte grise'),
    
    type_fissure: n.includes('fissure') || t.includes('fissure'),
    type_casse: n.includes('casse') || t.includes('casse'),
    type_joint: n.includes('joint') || t.includes('joint'),
    type_presse: n.includes('presse') || t.includes('presse'),
    type_autre: false,
    
    fuite_can: false,
    fuite_bra: true,
    
    debit_fai: false, debit_moy: false, debit_for: false,
    vis_oui: false, vis_non: false, vis_aff: false, vis_autre: false,
    org_ter: false, org_mau: false, org_cor: false, org_autre: false
  };

  return { ...defaults, ...item };
};

export const fillSrmPage = async (pdfDoc, page, boldFont, form) => {
  const lon = parseFloat(form.x);
  const lat = parseFloat(form.y);
  const mapBase64 = await generateMapImage(lon, lat, 576, 99, form.mapType);

  if (mapBase64) {
    try {
      const mapImage = await pdfDoc.embedPng(mapBase64);
      const mapWidth = 576;
      const mapHeight = 99;
      const mapRawY = 170; 

      page.drawImage(mapImage, {
        x: 28,
        y: page.getHeight() - mapRawY - mapHeight,
        width: mapWidth,
        height: mapHeight,
      });
    } catch (err) {
      console.warn("Erreur intégration carte:", err);
    }
  }

  let displayDate = form.date;
  if (displayDate && displayDate.includes('-')) {
    const [year, month, day] = displayDate.split('-');
    displayDate = `${day}/${month}/${year}`;
  }

  drawText(page, displayDate, 113, 108.86, boldFont);
  drawText(page, form.nCompteur, 455, 108.86, boldFont);
  drawText(page, form.adresse, 113, 127.22, boldFont);
  drawText(page, form.x, 455, 127.22, boldFont);
  drawText(page, form.y, 455, 142.46, boldFont);

  drawCheckbox(page, form.fuite_can, 213.18, 320.93);
  drawCheckbox(page, form.fuite_bra, 213.18, 338);

  drawCheckbox(page, form.mat_ac, 213.18, 368.33);
  drawCheckbox(page, form.mat_fg, 213.18, 386);
  drawCheckbox(page, form.mat_fd, 213.18, 400.01);
  drawCheckbox(page, form.mat_pe, 213.18, 415.75);
  drawCheckbox(page, form.mat_pvc, 213.18, 431.59);

  drawTypeFuiteCheckbox(page, form.type_casse, 213.18, 463.27);
  drawTypeFuiteCheckbox(page, form.type_fissure, 213.18, 478.99);
  drawTypeFuiteCheckbox(page, form.type_joint, 213.18, 494.83);
  drawTypeFuiteCheckbox(page, form.type_presse, 213.18, 510.67);
  drawTypeFuiteCheckbox(page, form.type_autre, 213.18, 526.51);

  drawRightCheckbox(page, form.debit_fai, 544.23, 309.53);
  drawRightCheckbox(page, form.debit_moy, 544.23, 325.37);
  drawRightCheckbox(page, form.debit_for, 544.23, 341.09);

  drawText(page, form.estimation, 445, 355.97, boldFont);

  drawRightCheckbox(page, form.vis_oui, 544.23, 390.29);
  drawVisAutresCheckbox(page, form.vis_non, 544.23, 406.01);
  drawVisAutresCheckbox(page, form.vis_aff, 544.23, 421.87);
  drawVisAutresCheckbox(page, form.vis_autre, 544.23, 437.71);

  drawOrigineCheckbox(page, form.org_ter, 544.23, 487.39);
  drawOrigineCheckbox(page, form.org_mau, 544.23, 503.23);
  drawOrigineCheckbox(page, form.org_cor, 544.23, 518.95);
  drawOrigineCheckbox(page, form.org_autre, 544.23, 534.79);

  drawText(page, form.obs1, 75, 589.78, boldFont);
  drawText(page, form.obs2, 75, 605.50, boldFont);

  drawText(page, form.mat1, 95, 621.34, boldFont);
  drawText(page, form.mat2, 75, 637.18, boldFont);
};

export const generateSrmPdfBytes = async (form) => {
  const existingPdfBytes = await fetch('/SRM.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const firstPage = pdfDoc.getPages()[0];
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  await fillSrmPage(pdfDoc, firstPage, boldFont, form);

  return await pdfDoc.save();
};

export const generateBulkSrmPdfBytes = async (list) => {
  const existingPdfBytes = await fetch('/SRM.pdf').then(res => res.arrayBuffer());
  const templateDoc = await PDFDocument.load(existingPdfBytes);
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const item of list) {
    const form = mapItemToSrmForm(item);
    const [copiedPage] = await pdfDoc.copyPages(templateDoc, [0]);
    await fillSrmPage(pdfDoc, copiedPage, boldFont, form);
    pdfDoc.addPage(copiedPage);
  }

  return await pdfDoc.save();
};

export const generateSrmPdf = async (form, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const pdfBytes = await generateSrmPdfBytes(form);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SRM_${form.date}_${form.nCompteur || 'Intervention'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Erreur PDF: Assurez-vous que l'original est bien dans le dossier public et nommé SRM.pdf");
  } finally {
    if (setLoading) setLoading(false);
  }
};
