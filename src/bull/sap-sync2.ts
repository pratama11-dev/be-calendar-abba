// import { Job } from "bullmq";
// import { poolPromise } from "../mssql/pool";
// import { OCRD, OITM, OPDN, OPOR, OPRQ, ORDR, OWOR, PDN1, POR1, PRQ1, RDR1, WOR1 } from "../types/sap-raw";
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// export const SyncSalesOrder = async (job: Job) => {
//     const pool = await poolPromise;
//     const batchSize = 50;
//     let pageIndex = 0;
//     let rowsAffected: number;

//     const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ORDR`);
//     const totalRows = totalRowsQuery.recordset[0].totalCount;

//     do {
//         console.log('Selecting data batch:', pageIndex + 1);

//         const query = await pool.request().query(`
//             SELECT * FROM ORDR
//             ORDER BY DocNum
//             OFFSET ${pageIndex * batchSize} ROWS
//             FETCH NEXT ${batchSize} ROWS ONLY
//         `);

//         const batch = query.recordset;

//         // If batch is empty, no more data to process
//         if (batch.length === 0) {
//             break;
//         }

//         rowsAffected = batch.length;

//         console.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`);
//         job.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`)

//         const batchPromises = batch.map(dt =>
//             prisma.ppic_sap_sales_order.upsert({
//                 where: {
//                     DocEntry: dt.DocEntry
//                 },
//                 create: dt,
//                 update: dt,
//             })
//         );

//         await Promise.all(batchPromises);

//         const processedRows = (pageIndex * batchSize) + rowsAffected;
//         const progress = Math.round((processedRows / totalRows) * 100) ;
//         console.log({processedRows, totalRows})
//         // job.progress = progress
//         await job.updateProgress(progress)

//         pageIndex++;
//     } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
// };

// export const SyncSalesOrderDocs = async () => {
//     const pool = await poolPromise;
//     const query = await pool.request().query(`
//         select * from RDR1
//       `)
//     const mapResult: RDR1[] = query.recordset;
//     const promiseBatches = []; // to hold all batches of promises

//     for (let i = 0; i < mapResult.length; i += 50) {
//         let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

//         const batchPromises = batch.map(dt =>
//             prisma.ppic_sap_sales_order_docs.upsert({
//                 where: {
//                     DocEntry_LineNum: {
//                         DocEntry: dt.DocEntry,
//                         LineNum: dt.LineNum
//                     }
//                 },
//                 create: dt,
//                 update: dt,
//             })
//         );

//         promiseBatches.push(batchPromises); // push the batch of promises into the batches array
//     }

//     let i = 0;
//     for (const batch of promiseBatches) {
//         i++;
//         console.log('Processing insert from sap RDR1 to our db ppic_sap_sales_order_docs', i, batch.length)
//         await Promise.all(batch); // process each batch separately
//     }
// }

// export const SyncProductionOrder = async () => {
//     const pool = await poolPromise;
//     const query = await pool.request().query(`
//         select * from OWOR
//       `)
//     const mapResult: OWOR[] = query.recordset;
//     const promiseBatches = []; // to hold all batches of promises

//     for (let i = 0; i < mapResult.length; i += 50) {
//         let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

//         const batchPromises = batch.map(dt =>
//             prisma.ppic_sap_production_order.upsert({
//                 where: {
//                     DocEntry: dt.DocEntry
//                 },
//                 create: dt,
//                 update: dt,
//             })
//         );

//         promiseBatches.push(batchPromises); // push the batch of promises into the batches array
//     }

//     let i = 0;
//     for (const batch of promiseBatches) {
//         i++;
//         console.log('Processing insert from sap RDR1 to our db ppic_sap_sales_order_docs', i, batch.length)
//         await Promise.all(batch); // process each batch separately
//     }
// }

// export const SyncProductionOrderDocs = async () => {
//     const pool = await poolPromise;
//     const query = await pool.request().query(`
//         select * from WOR1
//       `)
//     const mapResult: WOR1[] = query.recordset;
//     const promiseBatches = []; // to hold all batches of promises

//     for (let i = 0; i < mapResult.length; i += 50) {
//         let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

//         const batchPromises = batch.map(dt =>
//             prisma.ppic_sap_production_order_docs.upsert({
//                 where: {
//                     DocEntry_LineNum: {
//                         DocEntry: dt.DocEntry,
//                         LineNum: dt.LineNum
//                     }
//                 },
//                 create: dt,
//                 update: dt,
//             })
//         );

//         promiseBatches.push(batchPromises); // push the batch of promises into the batches array
//     }

//     let i = 0;
//     for (const batch of promiseBatches) {
//         i++;
//         console.log('Processing insert from sap RDR1 to our db ppic_sap_sales_order_docs', i, batch.length)
//         await Promise.all(batch); // process each batch separately
//     }
// }