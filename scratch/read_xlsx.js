/* eslint-disable */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Formulir Kuesionar Kondisi dan Keberadaan Aset (SMKN 1 Percut Sei Tuan).xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['KIB B-INTRA'];
  
  console.log('KIB B-INTRA Headers:');
  for (let c = 15; c <= 24; c++) {
    const r8 = sheet[XLSX.utils.encode_cell({ r: 7, c })];
    const r9 = sheet[XLSX.utils.encode_cell({ r: 8, c })];
    
    console.log(`Col ${c+1} (${XLSX.utils.encode_col(c)}):`, 
                r8 && r8.v !== undefined ? r8.v : '', ' | ', 
                r9 && r9.v !== undefined ? r9.v : '');
  }
} catch (err) {
  console.error(err);
}
