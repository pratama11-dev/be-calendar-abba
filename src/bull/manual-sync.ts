import { Job } from "bullmq";
import { poolPromise } from "../mssql/pool";
import { OCRD, OITM, OPDN, OPOR, OPRQ, ORDR, OWOR, PDN1, POR1, PRQ1, RDR1, WOR1 } from "../types/sap-raw";
import { PrismaClient } from '@prisma/client'
import { Int } from "mssql";
import { DateUtil } from "../Utils/dateUtils";
import { doMonthlyStockSync } from "./monthly-stock";

const prisma = new PrismaClient();

export const manSyncMasterItem = async ({
    item_code,
    prisma
}: {
    item_code: string,
    prisma: PrismaClient
}) => {
    const pool = await poolPromise;
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
        where ItemCode='${item_code}'
    `);
    const dt = query.recordset?.[0];
    const upsert = await prisma.ppic_sap_master_item.upsert({
        where: {
            ItemCode: dt.ItemCode
        },
        create: dt,
        update: dt,
    });
    return upsert
}

export const manSyncBusinessPartner = async ({
    CardCode,
    prisma
}: {
    CardCode: string,
    prisma: PrismaClient
}) => {
    const pool = await poolPromise;
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
        FROM OCRD
        WHERE CardCode='${CardCode}'
    `);

    const dt = query.recordset?.[0];

    const upsert = await prisma.ppic_sap_business_partner.upsert({
        where: {
            CardCode: dt.CardCode
        },
        create: dt,
        update: dt,
    });

    return upsert;
}

export const manResyncSalesOrderInventoryTransfer = async ({
    job,
    prisma,
    docnum
}: {
    job?: Job,
    prisma?: PrismaClient,
    docnum?: number
}) => {
    const log1 = {
        info: `Sync Inventory Transfer Supply Docs`,
    }
    if (job) job.log(JSON.stringify(log1));
    // check if having so in inventory_transfer supply
    const count = await prisma.ppic_inventory_transfer_supply.count({
        where: {
            id_so: docnum
        }
    })
    if (count > 0) {
        const data_ivt = await prisma.ppic_inventory_transfer_supply.findFirst({
            where: {
                id_so: docnum
            }
        })
        const data: { id_so: number, id: number, item_code: string, feeder: string, composition: string }[] = await prisma.$queryRaw`
            SELECT
                ivts.id_so,
                ivts_doc.id,
                ivts_doc.item_code,
                ivts_doc.feeder,
                ivts_doc.composition
            FROM
                ppic.ppic_inventory_transfer_supply ivts
                JOIN ppic.ppic_inventory_transfer_supply_docs ivts_doc ON ivts.id= ivts_doc.id_trf_supply 
            WHERE
                ivts.id_so= ${docnum}
        `;
        const data_so: {
            DocNum: number,
            ItemCode: string,
            ItemName: string,
            U_MIS_feeder: number,
            U_MIS_composition: number,
            total_pdo_plan: string
        }[] = await prisma.$queryRaw`
            SELECT
                so.DocNum,
                pdo_docs.ItemCode,
                pdo_docs.ItemName,
                pdo_docs.U_MIS_feeder,
                pdo_docs.U_MIS_composition,
                SUM ( pdo_docs.PlannedQty ) AS [total_pdo_plan],
                SUM ( pdo_docs.IssuedQty ) AS [total_pdo_issued]
            FROM
                ppic.ppic_sap_sales_order so
                JOIN ppic.ppic_sap_production_order pdo ON so.DocNum = pdo.OriginNum
                JOIN ppic.ppic_sap_production_order_docs pdo_docs ON pdo.DocEntry= pdo_docs.DocEntry 
            WHERE
                so.DocNum = ${docnum}
                AND pdo_docs.ItemCode LIKE '10%' 
            GROUP BY
                so.DocNum,
                pdo_docs.ItemCode,
                pdo_docs.ItemName,
                pdo_docs.U_MIS_feeder,
                pdo_docs.U_MIS_composition
        `;
        for await (const dt of data_so) {
            const find = data.findIndex((d) =>
                d.id_so == dt.DocNum &&
                d.item_code == dt.ItemCode &&
                d.feeder == dt?.U_MIS_feeder?.toString() &&
                d.composition == dt?.U_MIS_composition?.toString()
            );
            if (find !== -1) {
                const dataOld = data[find]
                await prisma.ppic_inventory_transfer_supply_docs.update({
                    where: {
                        id: dataOld.id
                    },
                    data: {
                        id_trf_supply: data_ivt.id,
                        required_netto_in_kg: parseFloat(dt?.total_pdo_plan ?? "0") ?? 0,
                        required_cones: dt?.U_MIS_feeder ? parseInt(dt?.U_MIS_feeder?.toString()) : 0,
                        item_code: dt.ItemCode,
                        feeder: dt?.U_MIS_feeder?.toString(),
                        composition: dt.U_MIS_composition?.toString(),
                        // doc created
                        id_status: 1,
                        created_at: DateUtil.CurDate(),
                        updated_at: DateUtil.CurDate()
                    }
                })
            } else {
                await prisma.ppic_inventory_transfer_supply_docs.create({
                    data: {
                        id_trf_supply: data_ivt.id,
                        required_netto_in_kg: parseFloat(dt?.total_pdo_plan ?? "0") ?? 0,
                        required_cones: dt?.U_MIS_feeder ? parseInt(dt?.U_MIS_feeder?.toString()) : 0,
                        item_code: dt.ItemCode,
                        feeder: dt?.U_MIS_feeder?.toString(),
                        composition: dt?.U_MIS_composition?.toString(),
                        // doc created
                        id_status: 1,
                        created_at: DateUtil.CurDate(),
                        updated_at: DateUtil.CurDate()
                    }
                })
            }
        }
    }
}

export const manSyncFuncSalesOrder = async ({
    docnum,
    search,
    prisma,
    job,
    skip_progress = false
}: {
    docnum: number,
    search: string,
    prisma: PrismaClient,
    job?: Job,
    skip_progress?: boolean
}) => {
    const pool = await poolPromise;
    let query
    if (!docnum) if (!search) throw new Error("docnum atau search harus diisi!");

    if (docnum) {
        query = await pool.request()
            .input('DocNum', Int, docnum)
            .query(`
                    SELECT 
                        * 
                    FROM 
                        ORDR 
                    WHERE 
                        DocNum=@DocNum
                `);
    }

    if (search) {
        query = await pool.request()
            .query(`
                    SELECT 
                        * 
                    FROM 
                        ORDR 
                    WHERE 
                        U_MIS_soreff LIKE '%${search}%' 
                        OR Comments LIKE '%${search}%' 
                `);
    }

    const mapRes: ORDR[] = query?.recordset;
    const length = mapRes.length ?? 0
    let processed = 0
    if (job && !skip_progress) {
        if (processed === 0 && length === 0) job.updateProgress(100);
    }
    for (const dt of mapRes) {
        await manSyncBusinessPartner({ CardCode: dt.CardCode, prisma })
        await prisma.ppic_sap_sales_order.upsert({
            where: {
                DocEntry: dt.DocEntry
            },
            create: dt,
            update: dt,
        });
        const querysodocs = await pool.request().input('DocEntry', Int, dt.DocEntry).query(`
                SELECT * FROM RDR1 where DocEntry = @DocEntry
            `);

        const batch2: RDR1[] = querysodocs.recordset;
        const log1 = {
            info: `Inserting SO Doc for ${dt.DocNum}`,
            sodocs: batch2.map((d) => {
                return {
                    itemcode: d.ItemCode,
                    entry: d.DocEntry,
                    linenum: d.LineNum
                }
            })
        }
        if (job) job.log(JSON.stringify(log1))

        for await (const dtw of batch2) {
            const dta: RDR1 = dtw
            try {
                await manSyncMasterItem({ item_code: dta.ItemCode, prisma })
                await prisma.ppic_sap_sales_order_docs.upsert({
                    where: {
                        DocEntry_LineNum: {
                            DocEntry: dta.DocEntry,
                            LineNum: dta.LineNum
                        }
                    },
                    create: dta,
                    update: dta,
                })
            } catch (error) {
                console.log('found error when inserting to ppic_sap_sales_order_docs');
                console.error(error);
                if (job) job.log(JSON.stringify(error))
            }
        }
        const query3 = await pool.request().query(`
                SELECT * FROM OWOR
                WHERE OriginNum='${dt.DocNum}'
            `);

        const dt2: OWOR[] = query3.recordset;
        if (dt2.length > 0) {
            const pdo = {
                info: `Inserting PDO`,
                pdo: dt2.map((d) => {
                    return {
                        docnum: d.ItemCode,
                        entry: d.DocEntry,
                        origin: d.OriginNum
                    }
                })
            }
            if (job) job.log(JSON.stringify(pdo));
            for await (const dt3 of dt2) {
                await manSyncMasterItem({ item_code: dt3.ItemCode, prisma })
                await manSyncBusinessPartner({ CardCode: dt3.CardCode, prisma })
                await prisma.ppic_sap_production_order.upsert({
                    where: {
                        DocEntry: dt3.DocEntry
                    },
                    create: dt3,
                    update: dt3,
                });

                const querypdodocs = await pool.request().input('DocEntry', Int, dt3.DocEntry).query(`
                        SELECT * FROM WOR1
                        WHERE DocEntry=@DocEntry
                    `);

                const pordata: WOR1[] = querypdodocs.recordset;

                for await (const dt4 of pordata) {
                    try {
                        await manSyncMasterItem({ item_code: dt4.ItemCode, prisma })
                        await prisma.ppic_sap_production_order_docs.upsert({
                            where: {
                                DocEntry_LineNum: {
                                    DocEntry: dt4.DocEntry,
                                    LineNum: dt4.LineNum
                                },
                                // DocEntry_VisOrder: {
                                //     DocEntry: dt4.DocEntry,
                                //     VisOrder: dt4.VisOrder
                                // }
                            },
                            create: dt4,
                            update: dt4,
                        })
                    } catch (error) {
                        if (job) job.log(`found error when inserting to ppic_sap_production_order_docs, docentry: ${dt4.DocEntry}, linenum: ${dt4.LineNum}`)
                        console.error(error)
                    }
                }
            }
        }
        await manResyncSalesOrderInventoryTransfer({
            docnum: dt.DocNum,
            job: job,
            prisma
        })
        processed += 1
        if (job && !skip_progress) {
            const progress = parseFloat((processed / length).toFixed(2)) * 100
            console.log({
                processed,
                length,
                progress: progress
            })
            job.updateProgress(progress);
        }
    }
    if (job && !skip_progress) {
        job.updateProgress(100);
    }

    return mapRes;
}

export const manSyncFuncPurchaseOrder = async ({
    docnum,
    search,
    prisma,
    job,
    skip_progress = false
}: {
    docnum: number,
    search: string,
    prisma: PrismaClient,
    job?: Job,
    skip_progress?: boolean
}) => {
    const pool = await poolPromise;
    let query
    if (!docnum) if (!search) throw new Error("docnum atau search harus diisi!");

    if (docnum) {
        query = await pool.request().query(`
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
            FROM OPOR
            where docnum='${docnum}'
        `);
    }

    if (search) {
        query = await pool.request().query(`
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
            FROM OPOR
            where Comments LIKE '%${search}%' 
        `);
    }

    // get data ponya
    const mapRes: OPOR[] = query.recordset;
    const length = mapRes.length ?? 0
    let processed = 0
    for await (const dt of mapRes) {
        if (job) job.log(`Inserting po ${dt.DocNum}`)

        try {
            await manSyncBusinessPartner({ CardCode: dt.CardCode, prisma })
            await prisma.ppic_sap_purchase_order.upsert({
                where: {
                    DocNum: dt.DocNum
                },
                create: dt,
                update: dt,
            });
        } catch (error) {
            console.log('found error when inserting to ppic_sap_purchase_order');
            console.error(error);
            if (job) job.log(JSON.stringify(error))
        }

        const querypodocs = await pool.request().input('DocEntry', Int, dt.DocEntry).query(`
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
            FROM POR1
            where DocEntry = @DocEntry
        `);

        const pordata: POR1[] = querypodocs.recordset;
        const mapResult = pordata.map((d: POR1) => {
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

        try {
            // await Promise.all(batchPromises);
            for await (const dt2 of mapResult) {
                await manSyncMasterItem({ item_code: dt2.ItemCode, prisma })
                if (job) job.log(`Inserting po doc ${dt2.DocEntry} ${dt2.LineNum}`)
                await prisma.ppic_sap_purchase_order_docs.upsert({
                    where: {
                        DocEntry_LineNum: {
                            DocEntry: dt2.DocEntry,
                            LineNum: dt2.LineNum
                        }
                    },
                    create: dt2,
                    update: dt2,
                })
            }
        } catch (error) {
            console.log('found error when inserting to ppic_sap_purchase_order_docs');
            console.error(error);
            if (job) job.log(JSON.stringify(error))
        }

        processed += 1
        if (job && !skip_progress) {
            const progress = parseFloat((processed / length).toFixed(2)) * 100
            console.log({
                processed,
                length,
                progress: progress
            })
            job.updateProgress(progress);
        }
    }
}

export const SyncManualSO = async (job: Job) => {
    const { search, docnum } = job.data
    await manSyncFuncSalesOrder({
        docnum,
        search,
        prisma: prisma,
        job
    })
};

export const SyncManualPO = async (job: Job) => {
    const { search, docnum } = job.data
    await manSyncFuncPurchaseOrder({
        docnum,
        search,
        prisma: prisma,
        job
    })
};


export const doMonthlyStock = async ({
    prisma,
    job,
    skip_progress = false
}: {
    prisma: PrismaClient,
    job?: Job,
    skip_progress?: boolean
}) => {
    if (true) {
        console.log({
            progress: 0.1
        })
        if (job && !skip_progress) {
            job.updateProgress(0.1);
        }
        await doMonthlyStockSync({
            type: "po"
        }, prisma)
        console.log({
            progress: 0.35
        })
        if (job && !skip_progress) {
            job.updateProgress(0.35);
            job.log(`Berhasil sync montly po`)
        }
    }

    if (true) {
        await doMonthlyStockSync({
            type: "so"
        }, prisma)
        console.log({
            progress: 0.35
        })
        if (job && !skip_progress) {
            job.updateProgress(0.75);
            job.log(`Berhasil sync montly so`)
        }
    }

    if (true) {
        await doMonthlyStockSync({
            type: "yd"
        }, prisma)
        console.log({
            progress: 1
        })
        if (job && !skip_progress) {
            job.updateProgress(1);
            job.log(`Berhasil sync montly yd`)
        }
    }
}