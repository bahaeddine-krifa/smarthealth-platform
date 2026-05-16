"use strict";
require("dotenv").config();
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const sqlite3 = require("sqlite3").verbose();
const {
  connectProducer,
  startConsumer,
  publishStockLow,
  publishMedicationReserved,
} = require("./kafka");

const PROTO_PATH = path.join(__dirname, "inventory.proto");
const pkgDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const inventoryProto = grpc.loadPackageDefinition(pkgDef).inventory;

const dbPath = path.join(__dirname, "data", "medications.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ DB Inventory:", err.message);
});
db.serialize(() =>
  db.run(`CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY, name TEXT, dosage TEXT, stock_quantity INTEGER DEFAULT 0, price REAL, 
  supplier TEXT, is_low_stock BOOLEAN DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`),
);

const query = (sql, p = []) =>
  new Promise((res, rej) => db.get(sql, p, (e, r) => (e ? rej(e) : res(r))));
const all = (sql, p = []) =>
  new Promise((res, rej) =>
    db.all(sql, p, (e, r) => (e ? rej(e) : res(r || []))),
  );
const run = (sql, p = []) =>
  new Promise((res, rej) =>
    db.run(sql, p, function (e) {
      e ? rej(e) : res(this);
    }),
  );

const inventoryService = {
  AddMedication: async (call, cb) => {
    try {
      const { name, dosage, stock_quantity, price, supplier } = call.request;
      const id = `MED-${Date.now()}`;
      await run(
        "INSERT INTO medications (id, name, dosage, stock_quantity, price, supplier) VALUES (?,?,?,?,?,?)",
        [id, name, dosage, stock_quantity, price, supplier || ""],
      );
      const med = await query("SELECT * FROM medications WHERE id=?", [id]);
      cb(null, { success: true, message: "Medication added", medication: med });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
  GetMedication: async (call, cb) => {
    try {
      const med = await query("SELECT * FROM medications WHERE id=?", [
        call.request.id,
      ]);
      if (!med) {
        return cb(
          {
            code: grpc.status.NOT_FOUND,
            details: "Medication not found",
          },
          null,
        );
      }
      cb(null, { success: true, medication: med });
    } catch (e) {
      cb(
        {
          code: grpc.status.INTERNAL,
          details: e.message,
        },
        null,
      );
    }
  },
  UpdateStock: async (call, cb) => {
    try {
      const r = await run(
        "UPDATE medications SET stock_quantity = stock_quantity + ?, is_low_stock = CASE WHEN stock_quantity + ? < 10 THEN 1 ELSE 0 END WHERE id=?",
        [
          call.request.quantity_change,
          call.request.quantity_change,
          call.request.id,
        ],
      );
      if (r.changes === 0)
        return cb({ code: grpc.status.NOT_FOUND, details: "Not found" }, null);
      const med = await query("SELECT * FROM medications WHERE id=?", [
        call.request.id,
      ]);
      if (med.is_low_stock) publishStockLow(med).catch(console.error);
      cb(null, { success: true, message: "Stock updated" });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
  CheckAvailability: async (call, cb) => {
    try {
      const med = await query("SELECT * FROM medications WHERE id=?", [
        call.request.medication_id,
      ]);
      if (!med)
        return cb(
          { code: grpc.status.NOT_FOUND, details: "Medication not found" },
          null,
        );
      const available = med.stock_quantity >= call.request.requested_quantity;
      cb(null, {
        success: true,
        available,
        remaining_stock: med.stock_quantity,
      });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
  GetLowStockMedications: async (_, cb) => {
    try {
      cb(null, {
        success: true,
        medications: await all(
          "SELECT * FROM medications WHERE is_low_stock=1",
        ),
      });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
  ReserveMedication: async (call, cb) => {
    try {
      const med = await query("SELECT * FROM medications WHERE id=?", [
        call.request.medication_id,
      ]);
      if (!med || med.stock_quantity < call.request.quantity)
        return cb(
          {
            code: grpc.status.FAILED_PRECONDITION,
            details: "Insufficient stock",
          },
          null,
        );
      await run(
        "UPDATE medications SET stock_quantity = stock_quantity - ?, is_low_stock = CASE WHEN stock_quantity - ? < 10 THEN 1 ELSE 0 END WHERE id=?",
        [
          call.request.quantity,
          call.request.quantity,
          call.request.medication_id,
        ],
      );
      const updated = await query("SELECT * FROM medications WHERE id=?", [
        call.request.medication_id,
      ]);
      publishMedicationReserved(updated).catch(console.error);
      if (updated.is_low_stock) publishStockLow(updated).catch(console.error);
      cb(null, { success: true, message: "Medication reserved" });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
};

async function main() {
  await connectProducer();
  await startConsumer();
  const server = new grpc.Server();
  server.addService(inventoryProto.InventoryService.service, inventoryService);
  server.bindAsync(
    "0.0.0.0:50057",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("❌ Inventory Service:", err);
        return;
      }
      console.log(
        `✅ Inventory Service gRPC + SQLite3 + Kafka Consumer on port ${port}`,
      );
    },
  );
}
main();
