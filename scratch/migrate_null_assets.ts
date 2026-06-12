import "dotenv/config";
import { db } from "../src/db";
import { assets, jurusan } from "../src/db/schema";
import { eq, isNull, and } from "drizzle-orm";

async function runMigration() {
  console.log("--- MIGRATION START: MAPPING NULL ASSETS ---");

  // 1. Search for the 'Umum / Sekolah' department
  const targetJurusan = await db.query.jurusan.findFirst({
    where: eq(jurusan.namaJurusan, "Umum / Sekolah"),
  });

  if (!targetJurusan) {
    console.error("ERROR: Department 'Umum / Sekolah' was not found in the database!");
    console.log("Please create it manually first via the UI (Manajemen Jurusan).");
    
    // Log all existing jurusan to help the user identify typos
    const allJ = await db.select().from(jurusan);
    console.log("\nExisting Jurusan in Database:");
    allJ.forEach(j => {
      console.log(`- "${j.namaJurusan}"`);
    });
    
    process.exit(1);
  }

  console.log(`Found Target Department: "${targetJurusan.namaJurusan}" (ID: ${targetJurusan.id})`);

  // 2. Count assets currently having NULL jurusanId
  const beforeAssets = await db.query.assets.findMany({
    where: isNull(assets.jurusanId),
  });
  console.log(`Assets currently unassigned (jurusanId is NULL): ${beforeAssets.length}`);

  if (beforeAssets.length === 0) {
    console.log("SUCCESS: No unassigned assets left to migrate! All assets are already mapped.");
    process.exit(0);
  }

  // 3. Perform bulk update to the target department ID
  console.log("Updating database records...");
  const updateResult = await db
    .update(assets)
    .set({ jurusanId: targetJurusan.id, updatedAt: new Date() })
    .where(isNull(assets.jurusanId));

  // 4. Verify results
  const afterAssets = await db.query.assets.findMany({
    where: isNull(assets.jurusanId),
  });

  console.log("\n--- MIGRATION COMPLETE SUMMARY ---");
  console.log(`- Total Assets migrated: ${beforeAssets.length}`);
  console.log(`- Assets remaining unassigned (should be 0): ${afterAssets.length}`);
  console.log("SUCCESS: Database migration completed successfully!");
  
  process.exit(0);
}

runMigration().catch(console.error);
