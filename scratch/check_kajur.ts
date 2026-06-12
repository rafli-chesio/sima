import "dotenv/config";
import { db } from "../src/db";
import { users, userJurusan, assets, jurusan } from "../src/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";

async function diagnose() {
  console.log("--- 1. DIAGNOSIS START ---");
  
  // 1. Find user kajur@gmail.com
  const user = await db.query.users.findFirst({
    where: eq(users.email, "kajur@gmail.com"),
  });
  
  if (!user) {
    console.error("ERROR: User kajur@gmail.com not found!");
    return;
  }
  console.log(`Found user: ${user.name} (ID: ${user.id}, Role: ${user.role})`);
  
  // 2. Find userJurusan mapping
  const mappings = await db.select().from(userJurusan).where(eq(userJurusan.userId, user.id));
  console.log(`Found user-jurusan mappings for Fahmy:`, mappings);
  
  // 3. Find all jurusan in db
  const allJurusan = await db.select().from(jurusan);
  console.log("All Jurusan in Database:");
  allJurusan.forEach(j => {
    console.log(`- ${j.namaJurusan} (ID: ${j.id})`);
  });

  // 4. If Fahmy has a mapping, check assets in that department
  if (mappings.length > 0) {
    const jId = mappings[0].jurusanId;
    const jName = allJurusan.find(j => j.id === jId)?.namaJurusan || "Unknown";
    console.log(`\nFahmy's department is: ${jName} (${jId})`);
    
    const [scopedCount] = await db
      .select({ count: count() })
      .from(assets)
      .where(and(eq(assets.jurusanId, jId), isNull(assets.deletedAt)));
    
    console.log(`Total assets assigned to ${jName}: ${scopedCount?.count || 0}`);
  } else {
    console.warn("\nWARNING: Fahmy has NO department mapped in user_jurusan!");
  }

  // 5. Check assets with null jurusanId
  const [nullCount] = await db
    .select({ count: count() })
    .from(assets)
    .where(and(isNull(assets.jurusanId), isNull(assets.deletedAt)));
  console.log(`Total assets with NULL (unassigned) jurusanId: ${nullCount?.count || 0}`);

  // 6. Check asset counts by department
  const assetGroups = await db
    .select({
      jurusanId: assets.jurusanId,
      count: count()
    })
    .from(assets)
    .where(isNull(assets.deletedAt))
    .groupBy(assets.jurusanId);
  
  console.log("\nAssets count grouped by Jurusan ID:");
  assetGroups.forEach(g => {
    const name = allJurusan.find(j => j.id === g.jurusanId)?.namaJurusan || "NULL / Umum";
    console.log(`- ${name} (ID: ${g.jurusanId}): ${g.count} assets`);
  });

  console.log("\n--- DIAGNOSIS END ---");
  process.exit(0);
}

diagnose().catch(console.error);
