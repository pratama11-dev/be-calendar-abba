import { Job } from "bullmq";
import { poolPromise } from "../mssql/pool";
import { OCRD, OITM, OPDN, OPOR, OPRQ, PDN1, POR1, PRQ1 } from "../types/sap-raw";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const SyncMasterItem = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM OITM`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
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
};

export const SyncBusinessPartner = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'OCRD'
    let sapIndex = 'CardCode'
    let newTableName = 'ppic_sap_business_partner'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
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
};

export const SyncPurchaseRequest = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'OPRQ'
    let sapIndex = 'DocNum'
    let newTableName = 'ppic_sap_purchase_request'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
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
};

export const SyncPurchaseRequestDocs = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'PRQ1'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_purchase_request_docs'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT 
                DocEntry,
                ItemCode,
                LineNum,
                Dscription,
                Quantity,
                OpenQty,
                PackQty,
                unitMsr,
                unitMsr2,
                VolUnit,
                Price,
                DiscPrcnt,
                OpenCreQty,
                VatPrcnt,
                VatGroup,
                OrigItem,
                InvQty,
                OpenInvQty,
                OcrCode,
                LineVendor,
                UomCode,
                UomCode2 
            FROM ${sap_table_name}
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

        const batchPromises = batch.map((dt: PRQ1) =>
            prisma.ppic_sap_purchase_request_docs.upsert({
                where: {
                    DocEntry_LineNum: {
                        DocEntry: dt.DocEntry,
                        LineNum: dt.LineNum,
                    },
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

export const SyncPurchaseOrder = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'OPOR'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_purchase_order'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
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

        const batchPromises = batch.map((dt: OPOR) =>
            prisma.ppic_sap_purchase_order.upsert({
                where: {
                    DocEntry: dt.DocEntry,
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

export const SyncPurchaseOrderDocs = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'POR1'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_purchase_order_docs'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT
                BaseRef,
                DocEntry,
                LineNum,
                LineStatus,
                WhsCode,
                ItemCode,
                Dscription,
                Quantity,
                unitMsr,
                NumPerMsr,
                TrgetEntry,
                OpenQty,
                Price,
                Currency,
                Rate,
                DiscPrcnt,
                LineTotal,
                TotalFrgn,
                OpenSum,
                OpenSumFC,
                PriceBefDi,
                ShipDate,
                OpenCreQty,
                BaseCard,
                TotalSumSy,
                OpenSumSys,
                InvntSttus,
                OcrCode,
                "Text",
                VatPrcnt,
                VatGroup,
                PriceAfVAT,
                PackQty,
                INMPrice,
                TaxType,
                VatAppld,
                VatAppldFC,
                VatAppldSC,
                BaseQty,
                BaseOpnQty,
                VatDscntPr,
                LineVat,
                LineVatlF,
                LineVatS,
                GTotal,
                GTotalFC,
                GTotalSC,
                InvQty,
                OpenInvQty,
                LineVendor,
                BaseType,
                BaseEntry,
                BaseLine,
                VatSum
            FROM ${sap_table_name}
            ORDER BY ${sapIndex}
            OFFSET ${pageIndex * batchSize} ROWS
            FETCH NEXT ${batchSize} ROWS ONLY
        `);

        const batch: POR1[] = query.recordset;

        // If batch is empty, no more data to process
        if (batch.length === 0) {
            break;
        }

        rowsAffected = batch.length;

        console.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`);
        job.log(`Processing insert from sap ${sap_table_name} to our db ${newTableName}, batch ${pageIndex + 1}, size: ${batch.length}`)

        const mapResult = batch.map((d: POR1) => {
            const {
                BaseRef,
                DocEntry,
                LineNum,
                LineStatus,
                WhsCode,
                ItemCode,
                Dscription,
                Quantity,
                unitMsr,
                NumPerMsr,
                TrgetEntry,
                OpenQty,
                Price,
                Currency,
                Rate,
                DiscPrcnt,
                LineTotal,
                TotalFrgn,
                OpenSum,
                OpenSumFC,
                PriceBefDi,
                ShipDate,
                OpenCreQty,
                BaseCard,
                TotalSumSy,
                OpenSumSys,
                InvntSttus,
                OcrCode,
                Text,
                VatPrcnt,
                VatGroup,
                PriceAfVAT,
                PackQty,
                INMPrice,
                TaxType,
                VatAppld,
                VatAppldFC,
                VatAppldSC,
                BaseQty,
                BaseOpnQty,
                VatDscntPr,
                LineVat,
                LineVatlF,
                LineVatS,
                GTotal,
                GTotalFC,
                GTotalSC,
                InvQty,
                OpenInvQty,
                LineVendor,
                BaseType,
                BaseEntry,
                BaseLine,
                VatSum
            } = d;
            const group = {
                BaseRef: BaseRef ? parseInt(BaseRef) : undefined,
                DocEntry,
                LineNum,
                LineStatus,
                WhsCode,
                ItemCode,
                Dscription,
                Quantity,
                unitMsr,
                NumPerMsr,
                TrgetEntry,
                OpenQty,
                Price,
                Currency,
                Rate,
                DiscPrcnt,
                LineTotal,
                TotalFrgn,
                OpenSum,
                OpenSumFC,
                PriceBefDi,
                ShipDate,
                OpenCreQty,
                BaseCard,
                TotalSumSy,
                OpenSumSys,
                InvntSttus,
                OcrCode,
                Text,
                VatPrcnt,
                VatGroup,
                PriceAfVAT,
                PackQty,
                INMPrice,
                TaxType,
                VatAppld,
                VatAppldFC,
                VatAppldSC,
                BaseQty,
                BaseOpnQty,
                VatDscntPr,
                LineVat,
                LineVatlF,
                LineVatS,
                GTotal,
                GTotalFC,
                GTotalSC,
                InvQty,
                OpenInvQty,
                LineVendor,
                BaseType,
                BaseEntry,
                BaseLine,
                VatSum
            };
            return group;
        });

        const batchPromises = mapResult.map((dt) =>
            prisma.ppic_sap_purchase_order_docs.upsert({
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

        await Promise.all(batchPromises);

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};

export const SyncGoodsReceipt = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'OPDN'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_goods_receipt_po'

    const totalRowsQuery = await pool.request().query(`SELECT COUNT(*) as totalCount FROM ${sap_table_name}`);
    const totalRows = totalRowsQuery.recordset[0].totalCount;

    do {
        console.log('Selecting data batch:', pageIndex + 1);

        const query = await pool.request().query(`
            SELECT 
                *
            FROM ${sap_table_name}
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

        const batchPromises = batch.map((dt: OPDN) =>
            prisma.ppic_sap_goods_receipt_po.upsert({
                where: {
                    DocEntry: dt.DocEntry,
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

export const SyncGoodsReceiptDocs = async (job: Job) => {
    const pool = await poolPromise;
    const batchSize = 50;
    let pageIndex = 0;
    let rowsAffected: number;
    let sap_table_name = 'PDN1'
    let sapIndex = 'DocEntry'
    let newTableName = 'ppic_sap_goods_receipt_po_docs'

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

        const batchPromises = batch.map((dt: PDN1) =>
            prisma.ppic_sap_goods_receipt_po_docs.upsert({
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

        await Promise.all(batchPromises);

        const processedRows = (pageIndex * batchSize) + rowsAffected;
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log({ processedRows, totalRows })
        // job.progress = progress
        await job.updateProgress(progress)

        pageIndex++;
    } while (rowsAffected === batchSize); // If the last batch size was smaller, that means we reached the end
};