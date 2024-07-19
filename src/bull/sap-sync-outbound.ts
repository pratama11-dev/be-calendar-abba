import { Job } from "bullmq";
import { poolPromise } from "../mssql/pool";
import { OWOR, RDR1, WOR1 } from "../types/sap-raw";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const SyncSalesOrder = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ORDR`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT * FROM ORDR
            ORDER BY DocNum
            OFFSET ${pageIndex * batchSize} ROWS
            FETCH NEXT ${batchSize} ROWS ONLY
        `);

        const batch = query.recordset;

        // If batch is empty, no more data to process
        if (batch.length === 0) {
            break;
        }

        rowsAffected = batch.length;

        console.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`);
        job.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`)

        const batchPromises = batch.map(dt =>
            prisma.ppic_sap_sales_order.upsert({
                where: {
                    DocEntry: dt.DocEntry
                },
                create: dt,
                update: dt,
            })
        );

        await Promise.all(batchPromises);

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};

export const SyncSalesOrderDocs = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let skip = 3181;
    let pageIndex = 0 + skip;
    let rowsAffected: number;
    let sap_table_name = 'RDR1'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_sales_order_docs'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT * FROM ${sap_table_name}
            ORDER BY ${sapIndex}
            OFFSET ${pageIndex * batchSize} ROWS
            FETCH NEXT ${batchSize} ROWS ONLY
        `);

        const batch = query.recordset;

        // If batch is empty, no more data to process
        if (batch.length === 0) {
            break;
        }

        rowsAffected = batch.length;

        console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
        job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

        for (const dtw of batch) {
            const dt: RDR1 = dtw
            try {
                const data = await prisma.ppic_sap_sales_order_docs.upsert({
                    where: {
                        DocEntry_LineNum: {
                            DocEntry: dt.DocEntry,
                            LineNum: dt.LineNum
                        }
                    },
                    create: dt,
                    update: dt,
                })
            } catch (error) {
                console.log({
                    DocEntry: dt.DocEntry,
                    ItemCode: dt.ItemCode
                });
                console.log(error)
                // console.log(error)
            }
        }

        // const batchPromises = batch.map((dt: RDR1) =>
        //     prisma.ppic_sap_sales_order_docs.upsert({
        //         where: {
        //             DocEntry_LineNum: {
        //                 DocEntry: dt.DocEntry,
        //                 LineNum: dt.LineNum
        //             }
        //         },
        //         create: dt,
        //         update: dt,
        //     })
        // );

        // await Promise.all(batchPromises);

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};

export const SyncProductionOrder = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'OWOR'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_production_order'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT * FROM ${sap_table_name}
            ORDER BY ${sapIndex}
            OFFSET ${pageIndex * batchSize} ROWS
            FETCH NEXT ${batchSize} ROWS ONLY
        `);

        const batch = query.recordset;

        // If batch is empty, no more data to process
        if (batch.length === 0) {
            break;
        }

        rowsAffected = batch.length;

        console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
        job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

        const batchPromises = batch.map((dt: OWOR) =>
            prisma.ppic_sap_production_order.upsert({
                where: {
                    DocEntry: dt.DocEntry
                },
                create: dt,
                update: dt,
            })
        );

        try {
            await Promise.all(batchPromises);
        } catch (error) {
            job.log('found error')
            job.log(JSON.stringify(error))
        }

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};

export const SyncProductionOrderDocs = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'WOR1'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_production_order_docs'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name} WHERE ItemCode like '10%' or ItemCode like '11%'`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT * FROM ${sap_table_name}
            WHERE ItemCode like '10%' or ItemCode like '11%'
            ORDER BY ${sapIndex}
            OFFSET ${pageIndex * batchSize} ROWS
            FETCH NEXT ${batchSize} ROWS ONLY
        `);

        const batch = query.recordset;

        // If batch is empty, no more data to process
        if (batch.length === 0) {
            break;
        }

        rowsAffected = batch.length;

        console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
        job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

        const batchPromises = batch.map((dt: WOR1) => {
            const createParams = {
                ...dt
            };
            return prisma.ppic_sap_production_order_docs.upsert({
                where: {
                    DocEntry_LineNum: {
                        DocEntry: dt.DocEntry,
                        LineNum: dt.LineNum
                    }
                },
                create: createParams,
                update: dt,
            })
        }
        );
        await Promise.all(batchPromises);

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};