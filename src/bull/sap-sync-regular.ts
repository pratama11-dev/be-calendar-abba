import { Job } from "bullmq";
import { poolPromise } from "../mssql/pool";
import { OCRD, OITM, OPOR, OPRQ, ORDR, OWOR, POR1, RDR1, WOR1 } from "../types/sap-raw";
import { PrismaClient } from '@prisma/client'
import { DateTime, Int } from "mssql";
import { DateUtil } from "../Utils/dateUtils";
import { manSyncFuncPurchaseOrder, manSyncFuncSalesOrder } from "./manual-sync";
import moment from "moment";

const prisma = new PrismaClient()

export const SyncEssentials = async (job: Job) => {
    const last_sync = await prisma.ppic_sap_sync.findFirst({
        where: {
            id: 1
        }
    });
    const pool = await poolPromise;
    const batchSize = 50;

    // master item
    if (last_sync?.ls_master_item) {
        let pageIndex = 0;
        let rowsAffected: number;

        const dateforsync = moment(last_sync.ls_master_item).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        let totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM OITM WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                    SELECT 
                      ItemCode,
                      ItemName,
                      ItmsGrpCod,
                      OnHand,
                      IsCommited,
                      OnOrder,
                      BuyUnitMsr,
                      NumInBuy,
                      UpdateDate,
                      CommisGrp,
                      InvntItem,
                      PrchseItem,
                      SellItem,
                      TreeType,
                      U_MIS_Code,
                      U_MIS_SubGroup,
                      U_MIS_itemsubgroup,
                      U_MIS_fabconst,
                      U_MIS_yarnq,
                      U_MIS_yarnc,
                      U_MIS_spandex,
                      U_MIS_fabgsm,
                      U_MIS_fabwitdh,
                      U_MIS_acclenght,
                      U_MIS_accwidth,
                      U_MIS_colourhue,
                      U_MIS_striper,
                      U_MIS_custcode,
                      U_MIS_custname,
                      U_MIS_fabproc1,
                      U_MIS_fabproc2,
                      U_MIS_fabproc3,
                      U_MIS_fabproc4,
                      U_MIS_fabconvkgtom,
                      U_MIS_fabconvkgtoyrd,
                      U_MIS_RMPM
                    FROM OITM
                    WHERE updateDate > @updateDate
                    ORDER BY ItemCode
                    OFFSET ${pageIndex * batchSize} ROWS
                    FETCH NEXT ${batchSize} ROWS ONLY
                `);

            const batch = query.recordset;

            // If batch is empty, no more data to process
            if (batch.length === 0) {
                break;
            }

            rowsAffected = batch.length;
            console.log({ batch })

            console.log(`Processing insert from sap OITM to our db ppic_master_item, batch ${pageIndex + 1}, size: ${batch.length}`);
            job.log(`Processing insert from sap OITM to our db ppic_master_item, batch ${pageIndex + 1}, size: ${batch.length}`)

            const batchPromises = batch.map((dt: OITM) =>
                prisma.ppic_sap_master_item.upsert({
                    where: {
                        ItemCode: dt.ItemCode
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

        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_master_item: DateUtil.CurDate()
            }
        })
    } else {
        console.log('you havent expedite the date in the database for mi')
    }

    console.log('master item sync regular beres.');

    // business partner
    if (last_sync.ls_business_partner) {
        let pageIndex = 0;
        let rowsAffected: number = 0;
        let sap_table_name = 'OCRD'
        let sapIndex = 'CardCode'
        let newTableName = 'ppic_sap_business_partner'
        
        const dateforsync = moment(last_sync.ls_business_partner).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        const totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name} WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                SELECT 
                    CardCode,
                    CardName,
                    CardType,
                    GroupCode,
                    Address,
                    ZipCode,
                    MailAddres,
                    MailZipCod,
                    E_Mail,
                    Phone1,
                    Phone2,
                    Fax,
                    CntctPrsn,
                    City,
                    County,
                    Country,
                    MailCounty,
                    MailCountr,
                    CardFName 
                FROM ${sap_table_name}
                WHERE updateDate > @updateDate
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

            const batchPromises = batch.map((dt: OCRD) =>
                prisma.ppic_sap_business_partner.upsert({
                    where: {
                        CardCode: dt.CardCode
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

        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_business_partner: DateUtil.CurDate()
            }
        })
    }

    console.log('business partner sync regular beres.');
};

export const SyncInbound = async (job: Job) => {
    const last_sync = await prisma.ppic_sap_sync.findFirst({
        where: {
            id: 1
        }
    });
    const pool = await poolPromise;
    const batchSize = 50;

    // sync dlu semua pr...
    if (last_sync.ls_pr) {
        let pageIndex = 0;
        let rowsAffected: number = 0;
        let sap_table_name = 'OPRQ'
        let sapIndex = 'DocNum'
        let newTableName = 'ppic_sap_purchase_request'

        const dateforsync = moment(last_sync.ls_pr).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        const totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name} WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                SELECT 
                  Requester,
                  ReqName,
                  Branch,
                  Department,
                  DocEntry,
                  DocNum,
                  DocType,
                  CANCELED,
                  Handwrtten,
                  Printed,
                  DocStatus,
                  InvntSttus,
                  Transfered,
                  CreateDate,
                  DocDueDate,
                  DocDate,
                  ReqDate,
                  Comments,
                  U_MIS_Approve1,
                  U_MIS_Approve2,
                  U_MIS_Approve3,
                  U_MIS_Approve4 
                FROM ${sap_table_name}
                WHERE updateDate > @updateDate
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

            const batchPromises = batch.map((dt: OPRQ) =>
                prisma.ppic_sap_purchase_request.upsert({
                    where: {
                        DocNum: dt.DocNum
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

        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_pr: DateUtil.CurDate()
            }
        })
    }

    // sync po sama anaknya.
    if (last_sync.ls_po) {
        let pageIndex = 0;
        let rowsAffected: number;
        let sap_table_name = 'OPOR'
        let sapIndex = 'DocEntry'
        let newTableName = 'ppic_sap_purchase_order'

        const dateforsync = moment(last_sync.ls_pr).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        const totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name} WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                SELECT 
                DocEntry,
                DocNum,
                CardCode,
                CardName,
                DocType,
                CANCELED,
                Handwrtten,
                Printed,
                DocStatus,
                InvntSttus,
                Transfered,
                DocTotal,
                VatSum,
                DiscSum,
                PaidToDate,
                VatPaid,
                CreateDate,
                DocDueDate,
                DocDate,
                ReqDate,
                Comments,
                NumAtCard,
                TaxDate,
                U_MIS_approve1,
                U_MIS_approve2,
                U_MIS_approve3,
                U_MIS_soreff,
                U_MIS_SQFor,
                U_MIS_SOTYPE,
                U_MIS_NoKontrak,
                U_MIS_Kontrak
                FROM ${sap_table_name}
                WHERE updateDate > @updateDate
                ORDER BY ${sapIndex}
                OFFSET ${pageIndex * batchSize} ROWS
                FETCH NEXT ${batchSize} ROWS ONLY
            `);

            const batch: OPOR[] = query.recordset;

            // If batch is empty, no more data to process
            if (batch.length === 0) {
                break;
            }

            rowsAffected = batch.length;

            console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
            job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

            for (const dt of batch) {
                await manSyncFuncPurchaseOrder({
                    docnum: dt.DocNum,
                    search: undefined,
                    prisma,
                    job,
                    skip_progress: true
                })
            }

            const processedRows = (pageIndex * batchSize) + rowsAffected;
            const progress = Math.round((processedRows / totalRows) * 100);
            console.log({ processedRows, totalRows })
            // job.progress = progress
            await job.updateProgress(progress)

            pageIndex++;
        } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end

        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_po: DateUtil.CurDate(),
                ls_po_doc: DateUtil.CurDate()
            }
        })
    }
}

export const SyncOutbound = async (job: Job) => {
    const last_sync = await prisma.ppic_sap_sync.findFirst({
        where: {
            id: 1
        }
    });
    const pool = await poolPromise;
    const batchSize = 50;

    // so dan anaknya
    if (last_sync.ls_so) {
        let pageIndex = 0;
        let rowsAffected: number;

        const dateforsync = moment(last_sync.ls_so).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        const totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM ORDR WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                SELECT * FROM ORDR WHERE updateDate > @updateDate
                ORDER BY DocNum
                OFFSET ${pageIndex * batchSize} ROWS
                FETCH NEXT ${batchSize} ROWS ONLY
            `);

            const batch: ORDR[] = query.recordset;

            // If batch is empty, no more data to process
            if (batch.length === 0) {
                break;
            }

            rowsAffected = batch.length;

            console.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`);
            job.log(`Processing insert from sap ORDR to our db ppic_sap_sales_order, batch ${pageIndex + 1}, size: ${batch.length}`)

            for (const dt of batch) {
                await manSyncFuncSalesOrder({
                    docnum: dt.DocNum,
                    search: undefined,
                    prisma,
                    job,
                    skip_progress: true
                })
            }

            const processedRows = (pageIndex * batchSize) + rowsAffected;
            const progress = Math.round((processedRows / totalRows) * 100);
            console.log({ processedRows, totalRows })
            // job.progress = progress
            await job.updateProgress(progress)

            pageIndex++;
        } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end

        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_so: DateUtil.CurDate(),
                ls_so_doc: DateUtil.CurDate()
            }
        })
    }
}

export const SyncPDO = async (job: Job) => {
    const last_sync = await prisma.ppic_sap_sync.findFirst({
        where: {
            id: 1
        }
    });
    const pool = await poolPromise;
    const batchSize = 50;
    if (last_sync.ls_pdo) {
        let pageIndex = 0;
        let rowsAffected: number;
        let sap_table_name = 'OWOR'
        let sapIndex = 'DocEntry'
        let newTableName = 'ppic_sap_production_order'
        
        const dateforsync = moment(last_sync.ls_pdo).subtract(2,'day').format("YYYY-MM-DD HH:mm:ss.SSS")
        const totalRowsQuery = await pool.request().input('updateDate', DateTime, dateforsync).query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name} WHERE updateDate > @updateDate`);
        const totalRows = totalRowsQuery.recordset[0].totalCount;

        do {
            console.log('Selecting data batch:', pageIndex + 1);

            const query = await pool.request().input('updateDate', DateTime, dateforsync).query(`
                SELECT * FROM ${sap_table_name}
                WHERE updateDate > @updateDate
                ORDER BY ${sapIndex}
                OFFSET ${pageIndex * batchSize} ROWS
                FETCH NEXT ${batchSize} ROWS ONLY
            `);

            const batch: OWOR[] = query.recordset;

            // If batch is empty, no more data to process
            if (batch.length === 0) {
                break;
            }

            rowsAffected = batch.length;

            console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
            job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

            for (const dt of batch) {
                try {
                    await prisma.ppic_sap_production_order.upsert({
                        where: {
                            DocEntry: dt.DocEntry
                        },
                        create: dt,
                        update: dt,
                    });

                    const querypdodocs = await pool.request().input('DocEntry', Int, dt.DocEntry).query(`
                        SELECT * FROM WOR1
                        WHERE DocEntry=@DocEntry
                    `);
                    const pordata: WOR1[] = querypdodocs.recordset;
                    const batchPromiseswor1 = pordata.map((dt: WOR1) =>
                        prisma.ppic_sap_production_order_docs.upsert({
                            where: {
                                DocEntry_LineNum: {
                                    DocEntry: dt.DocEntry,
                                    LineNum: dt.LineNum
                                }
                            },
                            create: dt,
                            update: dt,
                        })
                    );
                    try {
                        await Promise.all(batchPromiseswor1);
                    } catch (error) {
                        job.log('found error')
                        job.log(JSON.stringify(error))
                    }
                } catch (error) {
                    job.log('found error')
                    job.log(JSON.stringify(error))
                }
            }

            const processedRows = (pageIndex * batchSize) + rowsAffected;
            const progress = Math.round((processedRows / totalRows) * 100);
            console.log({ processedRows, totalRows })
            // job.progress = progress
            await job.updateProgress(progress)

            pageIndex++;
        } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
        await prisma.ppic_sap_sync.update({
            where: {
                id: 1
            },
            data: {
                ls_pdo: DateUtil.CurDate()
            }
        })
    }
}