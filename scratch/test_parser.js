/* eslint-disable */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Formulir Kuesionar Kondisi dan Keberadaan Aset (SMKN 1 Percut Sei Tuan).xlsx');

function parseKibA(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const assets = [];
  
  for (let r = 10; r <= range.e.r; r++) {
    const getVal = (c) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : '';
    };
    
    const no = getVal(0);
    if (!no || no === '' || no.includes('JUMLAH') || no.includes('Dibuat')) break;
    if (isNaN(parseInt(no))) continue;
    
    assets.push({
      namaBarang: getVal(1),
      kodeBarang: getVal(2),
      noRegister: getVal(3),
      luasM2: getVal(4),
      tahunPengadaan: parseInt(getVal(5)) || null,
      letakAlamat: getVal(6),
      statusTanah: getVal(7),
      sertifikatTanggal: getVal(8),
      sertifikatNomor: getVal(9),
      penggunaan: getVal(10),
      asalUsul: getVal(11),
      harga: parseFloat(getVal(12)) || 0,
      keterangan: getVal(18),
      kibCategory: 'KIB_A',
      kibType: 'INTRA'
    });
  }
  return assets;
}

function parseKibB(sheet, type) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const assets = [];
  
  let dataStartIdx = -1;
  for (let r = 0; r < Math.min(20, range.e.r); r++) {
    const val = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (val && (String(val.v).trim().toLowerCase() === 'no' || String(val.v).trim().toLowerCase() === 'no.')) {
      const cellPlus2_A = sheet[XLSX.utils.encode_cell({ r: r + 2, c: 0 })];
      const cellPlus2_B = sheet[XLSX.utils.encode_cell({ r: r + 2, c: 1 })];
      
      const val2_A = cellPlus2_A ? String(cellPlus2_A.v).trim() : '';
      const val2_B = cellPlus2_B ? String(cellPlus2_B.v).trim() : '';
      
      if (val2_A === '1' && val2_B === '2') {
        // This is the index row (1, 2, 3...)
        dataStartIdx = r + 3;
      } else {
        dataStartIdx = r + 2;
      }
      break;
    }
  }
  
  if (dataStartIdx === -1) {
    dataStartIdx = type === 'INTRA' ? 9 : 11;
  }
  
  console.log(`Sheet B-${type} data starts at row ${dataStartIdx + 1}`);
  
  for (let r = dataStartIdx; r <= range.e.r; r++) {
    const getVal = (c) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : '';
    };
    
    const no = getVal(0);
    if (!no || no === '' || no.includes('JUMLAH') || no.includes('Dibuat')) break;
    if (isNaN(parseInt(no))) continue;
    
    assets.push({
      kodeBarang: getVal(1),
      namaBarang: getVal(2),
      noRegister: getVal(3),
      merk: getVal(4),
      ukuranCc: getVal(5),
      bahan: getVal(6),
      tahunPengadaan: parseInt(getVal(7)) || null,
      noPabrik: getVal(8),
      noRangka: getVal(9),
      noMesin: getVal(10),
      noPolisi: getVal(11),
      noBpkb: getVal(12),
      asalUsul: getVal(13),
      quantity: parseInt(getVal(14)) || 1,
      harga: parseFloat(getVal(15)) || 0,
      kondisi: getVal(17) || 'BAIK',
      keterangan: getVal(22),
      kibCategory: 'KIB_B',
      kibType: type
    });
  }
  return assets;
}

function parseKibC(sheet, type) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const assets = [];
  
  for (let r = 9; r <= range.e.r; r++) {
    const getVal = (c) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : '';
    };
    
    const no = getVal(0);
    if (!no || no === '' || no.includes('JUMLAH') || no.includes('Dibuat')) break;
    if (isNaN(parseInt(no))) continue;
    
    let luasM2 = '';
    let statusTanah = '';
    let asalUsul = '';
    let harga = 0;
    
    if (type === 'INTRA') {
      luasM2 = getVal(11);
      statusTanah = getVal(12);
      asalUsul = getVal(14);
      harga = parseFloat(getVal(15)) || 0;
    } else {
      const colL = getVal(11);
      const colM = getVal(12);
      if (colL === '' && !isNaN(parseFloat(colM))) {
        luasM2 = colM;
        statusTanah = getVal(13);
        asalUsul = getVal(14);
        harga = parseFloat(getVal(15)) || 0;
      } else {
        luasM2 = colL;
        statusTanah = colM;
        asalUsul = getVal(14);
        harga = parseFloat(getVal(15)) || 0;
      }
    }
    
    assets.push({
      namaBarang: getVal(1),
      kodeBarang: getVal(2),
      noRegister: getVal(3),
      kondisi: getVal(4) || 'BAIK',
      konstruksiTingkat: getVal(5),
      konstruksiBeton: getVal(6),
      luasLantai: getVal(7),
      letakAlamat: getVal(8),
      luasM2: luasM2,
      statusTanah: statusTanah,
      asalUsul: asalUsul,
      harga: harga,
      keterangan: type === 'INTRA' ? getVal(23) : getVal(21),
      kibCategory: 'KIB_C',
      kibType: type
    });
  }
  return assets;
}

try {
  const workbook = XLSX.readFile(filePath);
  
  const kibA = parseKibA(workbook.Sheets['KIB A']);
  console.log(`Parsed ${kibA.length} assets from KIB A`);
  console.log('KIB A Sample:', kibA[0]);
  
  const kibBIntra = parseKibB(workbook.Sheets['KIB B-INTRA'], 'INTRA');
  console.log(`Parsed ${kibBIntra.length} assets from KIB B-INTRA`);
  console.log('KIB B-INTRA Sample:', kibBIntra[0]);
  
  const kibBExtra = parseKibB(workbook.Sheets['KIB B-EXTRA '], 'EXTRA');
  console.log(`Parsed ${kibBExtra.length} assets from KIB B-EXTRA`);
  console.log('KIB B-EXTRA Sample:', kibBExtra[0]);
  
  const kibCIntra = parseKibC(workbook.Sheets['KIB C-INTRA '], 'INTRA');
  console.log(`Parsed ${kibCIntra.length} assets from KIB C-INTRA`);
  console.log('KIB C-INTRA Sample:', kibCIntra[0]);
  
  const kibCExtra = parseKibC(workbook.Sheets['KIB C-EXTRA'], 'EXTRA');
  console.log(`Parsed ${kibCExtra.length} assets from KIB C-EXTRA`);
  console.log('KIB C-EXTRA Sample:', kibCExtra[0]);
  
} catch (err) {
  console.error(err);
}
