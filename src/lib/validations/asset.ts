import { z } from "zod";

export const assetSchema = z.object({
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  kodeUnik: z.string().optional(),
  assetType: z.enum(["FIXED", "CONSUMABLE"]),
  merkType: z.string().optional().nullable(),
  ukuranCc: z.string().optional().nullable(),
  bahan: z.string().optional().nullable(),
  tahunPembelian: z.number().optional().nullable(),
  asalUsul: z.string().optional().nullable(),
  jumlahBarang: z.number().int().min(1),
  hargaSatuan: z.number().min(0),
  jurusanId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]),
});
