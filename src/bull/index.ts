
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv';
import {
  SyncBusinessPartner,
  SyncGoodsReceipt,
  SyncGoodsReceiptDocs,
  SyncMasterItem,
  SyncPurchaseOrder, SyncPurchaseOrderDocs,
  SyncPurchaseRequest, SyncPurchaseRequestDocs
} from './sap-sync-inbound';
// import {
//   SyncProductionOrder,
//   SyncProductionOrderDocs,
//   SyncSalesOrder,
//   SyncSalesOrderDocs
// } from './sap-sync-outbound';
import { SyncEssentials, SyncInbound, SyncOutbound, SyncPDO } from './sap-sync-regular';
import { SyncManualPO, SyncManualSO, doMonthlyStock } from './manual-sync';
// import { SyncGoodsReceipt } from './sap-sync';

dotenv.config();
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const conn = {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
}

const syncWorker1 = new Worker('master item', async (job) => {
  const prisma = new PrismaClient()
  await SyncMasterItem(job)

  await prisma.$disconnect()
}, conn);

const syncWorker2 = new Worker('business partner', async (job) => {
  const prisma = new PrismaClient()
  await SyncBusinessPartner(job)
  await prisma.$disconnect()
}, conn);

const syncWorker3 = new Worker('purchase request', async (job) => {
  const prisma = new PrismaClient()
  await SyncPurchaseRequest(job)
  await prisma.$disconnect()
}, conn);

const syncWorker4 = new Worker('purchase request docs', async (job) => {
  const prisma = new PrismaClient()
  await SyncPurchaseRequestDocs(job)
  await prisma.$disconnect()
}, conn);

const syncWorker5 = new Worker('purchase order', async (job) => {
  const prisma = new PrismaClient()
  await SyncPurchaseOrder(job)
  await prisma.$disconnect()
}, conn);

const syncWorker6 = new Worker('purchase order docs', async (job) => {
  const prisma = new PrismaClient()
  await SyncPurchaseOrderDocs(job)
  await prisma.$disconnect()
}, conn);

const syncWorker7 = new Worker('goods receipt', async (job) => {
  const prisma = new PrismaClient()
  await SyncGoodsReceipt(job)
  await prisma.$disconnect()
}, conn);

const syncWorker8 = new Worker('goods receipt docs', async (job) => {
  const prisma = new PrismaClient()
  await SyncGoodsReceiptDocs(job)
  await prisma.$disconnect()
}, conn);

// const syncWorker9 = new Worker('sales order', async (job) => {
//   const prisma = new PrismaClient()
//   await SyncSalesOrder(job)
//   await prisma.$disconnect()
// }, conn);

// const syncWorker10 = new Worker('sales order docs', async (job) => {
//   const prisma = new PrismaClient()
//   await SyncSalesOrderDocs(job)
//   await prisma.$disconnect()
// }, conn);

// const syncWorker11 = new Worker('production order', async (job) => {
//   const prisma = new PrismaClient()
//   await SyncProductionOrder(job)
//   await prisma.$disconnect()
// }, conn);

// const syncWorker12 = new Worker('production order docs', async (job) => {
//   const prisma = new PrismaClient()
//   await SyncProductionOrderDocs(job)
//   await prisma.$disconnect()
// }, conn);

const syncWorker13 = new Worker("essentials", async (job) => {
  const prisma = new PrismaClient()
  await SyncEssentials(job)
  await prisma.$disconnect()
}, conn)

const syncWorker14 = new Worker("inbound", async (job) => {
  const prisma = new PrismaClient()
  await SyncInbound(job)
  await prisma.$disconnect()
}, conn)

const syncWorker15 = new Worker("outbound", async (job) => {
  const prisma = new PrismaClient()
  await SyncOutbound(job)
  await prisma.$disconnect()
}, conn)

const syncWorker16 = new Worker("pdo", async (job) => {
  const prisma = new PrismaClient()
  await SyncPDO(job)
  await prisma.$disconnect()
}, conn)

const syncWorker17 = new Worker("manual sync po", async (job) => {
  await SyncManualPO(job);
}, conn)

const syncWorker18 = new Worker("manual sync so", async (job) => {
  await SyncManualSO(job);
}, conn)

const syncWorker19 = new Worker("monthly-stock", async (job) => {
  const prisma = new PrismaClient()
  await doMonthlyStock({
    prisma,
    job,
    skip_progress: false
  })
  await prisma.$disconnect()
}, conn)

const onComplete = async (job: any) => {
  console.log(`Job ${job?.id} completed successfully.`);
}
const onFailed = async (job: any, err: any) => {
  console.log(`Job ${job?.id} failed with error: ${err.message}`);
}

syncWorker1.on('completed', onComplete);
syncWorker1.on('failed', onFailed);
syncWorker2.on('completed', onComplete);
syncWorker2.on('failed', onFailed);

syncWorker3.on('completed', onComplete);
syncWorker3.on('failed', onFailed);
syncWorker4.on('completed', onComplete);
syncWorker4.on('failed', onFailed);

syncWorker5.on('completed', onComplete);
syncWorker5.on('failed', onFailed);
syncWorker6.on('completed', onComplete);
syncWorker6.on('failed', onFailed);

syncWorker7.on('completed', onComplete);
syncWorker7.on('failed', onFailed);
syncWorker8.on('completed', onComplete);
syncWorker8.on('failed', onFailed);

// syncWorker9.on('completed', onComplete);
// syncWorker9.on('failed', onFailed);

// syncWorker10.on('completed', onComplete);
// syncWorker10.on('failed', onFailed);

// syncWorker11.on('completed', onComplete);
// syncWorker11.on('failed', onFailed);

// syncWorker12.on('completed', onComplete);
// syncWorker12.on('failed', onFailed);

syncWorker13.on('completed', onComplete);
syncWorker13.on('failed', onFailed);

syncWorker14.on('completed', onComplete);
syncWorker14.on('failed', onFailed);

syncWorker15.on('completed', onComplete);
syncWorker15.on('failed', onFailed);

syncWorker16.on('completed', onComplete);
syncWorker16.on('failed', onFailed);

syncWorker17.on('completed', onComplete);
syncWorker17.on('failed', onFailed);

syncWorker18.on('completed', onComplete);
syncWorker18.on('failed', onFailed);

syncWorker19.on('completed', onComplete);
syncWorker19.on('failed', onFailed);

console.log('[LOG] worker started')