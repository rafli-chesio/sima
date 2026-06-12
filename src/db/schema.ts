import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  boolean,
  date,
  primaryKey,
  bigint
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ENUMS as constants for application level checking
export const RoleEnum = ['ADMIN', 'KAJUR', 'VIEWER'] as const;
export const AssetTypeEnum = ['FIXED', 'CONSUMABLE'] as const;
export const AssetConditionEnum = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'] as const;
export const AssetStatusEnum = ['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'ARCHIVED'] as const;
export const ImageTypeEnum = ['DETAIL', 'AWAL', 'AKHIR', 'KERUSAKAN'] as const;
export const ApprovalStatusEnum = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const FinalStatusEnum = ['ACTIVE', 'RETURNED', 'OVERDUE'] as const;
export const ActionTypeEnum = ['CREATE', 'EDIT', 'MUTATION', 'BORROW', 'APPROVE', 'RETURN', 'DAMAGED', 'IMPORT', 'SOFT_DELETE', 'STOCK_ADD'] as const;
export const NotificationTypeEnum = ['NEW_REQUEST', 'OVERDUE', 'APPROVED', 'REJECTED', 'SYSTEM'] as const;

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('VIEWER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const jurusan = pgTable('jurusan', {
  id: uuid('id').primaryKey().defaultRandom(),
  namaJurusan: varchar('nama_jurusan', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const userJurusan = pgTable('user_jurusan', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  jurusanId: uuid('jurusan_id').references(() => jurusan.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.jurusanId] }),
}));

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  namaLokasi: varchar('nama_lokasi', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  namaBarang: varchar('nama_barang', { length: 255 }).notNull(),
  kodeUnik: varchar('kode_unik', { length: 255 }).notNull().unique(),
  assetType: varchar('asset_type', { length: 50 }).notNull(), // FIXED, CONSUMABLE
  merk: varchar('merk', { length: 255 }),
  tahunPengadaan: integer('tahun_pengadaan'),
  kondisi: varchar('kondisi', { length: 50 }).notNull().default('BAIK'),
  status: varchar('status', { length: 50 }).notNull().default('AVAILABLE'),
  quantity: integer('quantity').default(1).notNull(), // Stok untuk CONSUMABLE, 1 untuk FIXED
  qrCode: text('qr_code'),
  jurusanId: uuid('jurusan_id').references(() => jurusan.id),
  locationId: uuid('location_id').references(() => locations.id),
  
  // KIB specific columns
  kibCategory: varchar('kib_category', { length: 50 }), // KIB_A, KIB_B, KIB_C
  kibType: varchar('kib_type', { length: 50 }), // INTRA, EXTRA
  kodeBarang: varchar('kode_barang', { length: 255 }),
  noRegister: varchar('no_register', { length: 255 }),
  harga: bigint('harga', { mode: 'number' }),
  asalUsul: varchar('asal_usul', { length: 255 }),
  luasM2: varchar('luas_m2', { length: 255 }),
  letakAlamat: text('letak_alamat'),
  statusTanah: varchar('status_tanah', { length: 255 }),
  bahan: varchar('bahan', { length: 255 }),
  luasLantai: varchar('luas_lantai', { length: 255 }),
  konstruksiTingkat: varchar('konstruksi_tingkat', { length: 255 }),
  konstruksiBeton: varchar('konstruksi_beton', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const assetImages = pgTable('asset_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  urlFile: text('url_file').notNull(),
  tipeFile: varchar('tipe_file', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  borrowerId: uuid('borrower_id').references(() => users.id).notNull(),
  tanggalPinjam: date('tanggal_pinjam').notNull(),
  batasWaktu: date('batas_waktu').notNull(),
  tanggalKembaliReal: date('tanggal_kembali_real'),
  approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('PENDING'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),
  notes: text('notes'),
  quantity: integer('quantity').notNull().default(1),
  statusFinal: varchar('status_final', { length: 50 }),
  returnPhotoUrl: varchar('return_photo_url', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('DIPINJAM'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetHistory = pgTable('asset_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  performedBy: uuid('performed_by').references(() => users.id),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  previousValue: text('previous_value'),
  currentValue: text('current_value'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  relatedAssetId: uuid('related_asset_id').references(() => assets.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userJurusan: many(userJurusan),
  transactions: many(transactions, { relationName: 'borrower' }),
  approvedTransactions: many(transactions, { relationName: 'approver' }),
  history: many(assetHistory),
  notifications: many(notifications),
}));

export const jurusanRelations = relations(jurusan, ({ many }) => ({
  userJurusan: many(userJurusan),
  assets: many(assets),
}));

export const userJurusanRelations = relations(userJurusan, ({ one }) => ({
  user: one(users, {
    fields: [userJurusan.userId],
    references: [users.id],
  }),
  jurusan: one(jurusan, {
    fields: [userJurusan.jurusanId],
    references: [jurusan.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  jurusan: one(jurusan, {
    fields: [assets.jurusanId],
    references: [jurusan.id],
  }),
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  images: many(assetImages),
  transactions: many(transactions),
  history: many(assetHistory),
}));

export const assetImagesRelations = relations(assetImages, ({ one }) => ({
  asset: one(assets, {
    fields: [assetImages.assetId],
    references: [assets.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  asset: one(assets, {
    fields: [transactions.assetId],
    references: [assets.id],
  }),
  borrower: one(users, {
    fields: [transactions.borrowerId],
    references: [users.id],
    relationName: 'borrower',
  }),
  approver: one(users, {
    fields: [transactions.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
}));

export const assetHistoryRelations = relations(assetHistory, ({ one }) => ({
  asset: one(assets, {
    fields: [assetHistory.assetId],
    references: [assets.id],
  }),
  performer: one(users, {
    fields: [assetHistory.performedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
