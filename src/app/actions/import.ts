"use server";

import { db } from "@/db";
import { assets, assetHistory } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { z } from "zod";

// Zod Schema for validating KIB Assets before database insertion
const KIBAssetSchema = z.object({
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  kodeUnik: z.string(),
  assetType: z.enum(["FIXED", "CONSUMABLE"]),
  merk: z.string().optional().nullable(),
  tahunPengadaan: z.number().optional().nullable(),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]),
  status: z.string().default("AVAILABLE"),
  quantity: z.number().default(1),
  kibCategory: z.enum(["KIB_A", "KIB_B", "KIB_C"]),
  kibType: z.enum(["INTRA", "EXTRA"]),
  kodeBarang: z.string().optional().nullable(),
  noRegister: z.string().optional().nullable(),
  harga: z.number().default(0),
  asalUsul: z.string().optional().nullable(),
  luasM2: z.string().optional().nullable(),
  letakAlamat: z.string().optional().nullable(),
  statusTanah: z.string().optional().nullable(),
  bahan: z.string().optional().nullable(),
  luasLantai: z.string().optional().nullable(),
  konstruksiTingkat: z.string().optional().nullable(),
  konstruksiBeton: z.string().optional().nullable(),
});

type KIBAssetInput = z.infer<typeof KIBAssetSchema>;

function parseKibA(sheet: XLSX.WorkSheet, timestamp: number): KIBAssetInput[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const parsedAssets: KIBAssetInput[] = [];

  for (let r = 10; r <= range.e.r; r++) {
    const getVal = (c: number) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : "";
    };

    const no = getVal(0);
    if (!no || no === "" || no.includes("JUMLAH") || no.includes("Dibuat")) break;
    if (isNaN(parseInt(no))) continue;

    const rawHarga = getVal(12);
    const harga = parseFloat(rawHarga) || 0;

    parsedAssets.push({
      namaBarang: getVal(1) || "Tanpa Nama (KIB A)",
      kodeUnik: `KIB-A-INTRA-${timestamp}-${no}`,
      assetType: "FIXED",
      kodeBarang: getVal(2),
      noRegister: getVal(3),
      luasM2: getVal(4),
      tahunPengadaan: parseInt(getVal(5)) || null,
      letakAlamat: getVal(6),
      statusTanah: getVal(7),
      asalUsul: getVal(11),
      harga,
      kondisi: "BAIK", // Default KIB A to BAIK
      status: "AVAILABLE",
      quantity: 1,
      kibCategory: "KIB_A",
      kibType: "INTRA",
    });
  }
  return parsedAssets;
}

function parseKibB(sheet: XLSX.WorkSheet, type: "INTRA" | "EXTRA", timestamp: number): KIBAssetInput[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const parsedAssets: KIBAssetInput[] = [];

  let dataStartIdx = -1;
  for (let r = 0; r < Math.min(20, range.e.r); r++) {
    const val = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (val && (String(val.v).trim().toLowerCase() === "no" || String(val.v).trim().toLowerCase() === "no.")) {
      const cellPlus2_A = sheet[XLSX.utils.encode_cell({ r: r + 2, c: 0 })];
      const cellPlus2_B = sheet[XLSX.utils.encode_cell({ r: r + 2, c: 1 })];

      const val2_A = cellPlus2_A ? String(cellPlus2_A.v).trim() : "";
      const val2_B = cellPlus2_B ? String(cellPlus2_B.v).trim() : "";

      if (val2_A === "1" && val2_B === "2") {
        // Skips the sequential helper row (1, 2, 3...)
        dataStartIdx = r + 3;
      } else {
        dataStartIdx = r + 2;
      }
      break;
    }
  }

  if (dataStartIdx === -1) {
    dataStartIdx = type === "INTRA" ? 9 : 11;
  }

  for (let r = dataStartIdx; r <= range.e.r; r++) {
    const getVal = (c: number) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : "";
    };

    const no = getVal(0);
    if (!no || no === "" || no.includes("JUMLAH") || no.includes("Dibuat")) break;
    if (isNaN(parseInt(no))) continue;

    const rawKondisi = type === "INTRA" ? getVal(19) : getVal(17);
    let kondisi: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" = "BAIK";
    const kNormalized = rawKondisi.toUpperCase();
    if (kNormalized === "RB" || kNormalized.includes("BERAT")) {
      kondisi = "RUSAK_BERAT";
    } else if (kNormalized === "KB" || kNormalized === "RR" || kNormalized.includes("RINGAN") || kNormalized.includes("KURANG")) {
      kondisi = "RUSAK_RINGAN";
    }

    parsedAssets.push({
      namaBarang: getVal(2) || `Tanpa Nama (KIB B ${type})`,
      kodeUnik: `KIB-B-${type}-${timestamp}-${no}`,
      assetType: "FIXED",
      kodeBarang: getVal(1),
      noRegister: getVal(3),
      merk: getVal(4),
      bahan: getVal(6),
      tahunPengadaan: parseInt(getVal(7)) || null,
      asalUsul: getVal(13),
      quantity: parseInt(getVal(14)) || 1,
      harga: parseFloat(getVal(15)) || 0,
      kondisi,
      status: "AVAILABLE",
      kibCategory: "KIB_B",
      kibType: type,
    });
  }
  return parsedAssets;
}

function parseKibC(sheet: XLSX.WorkSheet, type: "INTRA" | "EXTRA", timestamp: number): KIBAssetInput[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const parsedAssets: KIBAssetInput[] = [];

  for (let r = 9; r <= range.e.r; r++) {
    const getVal = (c: number) => {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      return cell && cell.v !== undefined ? String(cell.v).trim() : "";
    };

    const no = getVal(0);
    if (!no || no === "" || no.includes("JUMLAH") || no.includes("Dibuat")) break;
    if (isNaN(parseInt(no))) continue;

    // Offset logic for C-EXTRA Luas & Status Tanah columns
    let luasM2 = "";
    let statusTanah = "";
    let asalUsul = "";
    let harga = 0;

    if (type === "INTRA") {
      luasM2 = getVal(11);
      statusTanah = getVal(12);
      asalUsul = getVal(14);
      harga = parseFloat(getVal(15)) || 0;
    } else {
      const colL = getVal(11);
      const colM = getVal(12);
      if (colL === "" && !isNaN(parseFloat(colM))) {
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

    const rawKondisi = getVal(4);
    let kondisi: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" = "BAIK";
    const kNormalized = rawKondisi.toUpperCase();
    if (kNormalized === "RB" || kNormalized.includes("BERAT")) {
      kondisi = "RUSAK_BERAT";
    } else if (kNormalized === "KB" || kNormalized === "RR" || kNormalized.includes("RINGAN") || kNormalized.includes("KURANG")) {
      kondisi = "RUSAK_RINGAN";
    }

    parsedAssets.push({
      namaBarang: getVal(1) || `Tanpa Nama (KIB C ${type})`,
      kodeUnik: `KIB-C-${type}-${timestamp}-${no}`,
      assetType: "FIXED",
      kodeBarang: getVal(2),
      noRegister: getVal(3),
      kondisi,
      status: "AVAILABLE",
      konstruksiTingkat: getVal(5),
      konstruksiBeton: getVal(6),
      luasLantai: getVal(7),
      letakAlamat: getVal(8),
      luasM2,
      statusTanah,
      asalUsul,
      harga,
      kibCategory: "KIB_C",
      kibType: type,
      quantity: 1,
    });
  }
  return parsedAssets;
}

export async function importKibExcel(formData: FormData): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Silakan login terlebih dahulu." };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "Tidak ada file Excel yang dipilih." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const timestamp = Date.now();

    const allAssets: KIBAssetInput[] = [];

    // Parse 'KIB A'
    const sheetA = workbook.Sheets["KIB A"];
    if (sheetA) {
      allAssets.push(...parseKibA(sheetA, timestamp));
    }

    // Parse 'KIB B-INTRA'
    const sheetBIntra = workbook.Sheets["KIB B-INTRA"];
    if (sheetBIntra) {
      allAssets.push(...parseKibB(sheetBIntra, "INTRA", timestamp));
    }

    // Parse 'KIB B-EXTRA ' (Note the trailing space)
    const sheetBExtra = workbook.Sheets["KIB B-EXTRA "] || workbook.Sheets["KIB B-EXTRA"];
    if (sheetBExtra) {
      allAssets.push(...parseKibB(sheetBExtra, "EXTRA", timestamp));
    }

    // Parse 'KIB C-INTRA ' (Note the trailing space)
    const sheetCIntra = workbook.Sheets["KIB C-INTRA "] || workbook.Sheets["KIB C-INTRA"];
    if (sheetCIntra) {
      allAssets.push(...parseKibC(sheetCIntra, "INTRA", timestamp));
    }

    // Parse 'KIB C-EXTRA'
    const sheetCExtra = workbook.Sheets["KIB C-EXTRA"];
    if (sheetCExtra) {
      allAssets.push(...parseKibC(sheetCExtra, "EXTRA", timestamp));
    }

    if (allAssets.length === 0) {
      return { success: false, error: "Tidak ada data aset KIB valid yang berhasil diproses dari Excel." };
    }

    // Validate using Zod schemas
    const validatedAssets = allAssets.map((asset, idx) => {
      const res = KIBAssetSchema.safeParse(asset);
      if (!res.success) {
        console.error(`Validation failed at index ${idx}:`, res.error.format());
        throw new Error(`Data tidak valid pada baris ${idx + 1}: ${res.error.issues[0].message}`);
      }
      return res.data;
    });

    console.log(`Validated ${validatedAssets.length} assets successfully. Proceeding with database transaction...`);

    // Execute in a database transaction
    await db.transaction(async (tx) => {
      const batchSize = 100;
      
      // We will bulk insert in batches to prevent hitting SQL query parameter limits
      for (let i = 0; i < validatedAssets.length; i += batchSize) {
        const batch = validatedAssets.slice(i, i + batchSize);
        
        const inserted = await tx.insert(assets).values(batch).returning({ id: assets.id });

        // Insert logs into assetHistory in batches
        const historyLogs = inserted.map((row) => ({
          assetId: row.id,
          performedBy: session.user.id,
          actionType: "IMPORT",
          notes: "Aset dimasukkan via impor massal Excel KIB",
        }));
        
        await tx.insert(assetHistory).values(historyLogs);
      }
    });

    revalidatePath("/admin/assets");

    return {
      success: true,
      count: validatedAssets.length,
    };
  } catch (err) {
    console.error("Error during KIB Excel Import:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan internal ketika memproses impor Excel KIB.",
    };
  }
}
