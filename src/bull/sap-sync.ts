import { poolPromise } from "../mssql/pool";
import { Job } from "bullmq";
import { OCRD, OITM, OPDN, OPOR, OPRQ, OWOR, PDN1, POR1, PRQ1 } from "../types/sap-raw";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const SyncMasterItem = async (job: Job) => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
          FROM
              OITM 
      `);
    const result: OITM[] = requery.recordset;
    const mapResult = result.map((d: OITM) => {
        const {
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
            U_MIS_RMPM,
        } = d;
        const group = {
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
            U_MIS_RMPM,
        };
        return group;
    });
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 50) {
        let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

        const batchPromises = batch.map(OITM =>
            prisma.ppic_sap_master_item.upsert({
                where: { ItemCode: OITM.ItemCode },
                create: OITM,
                update: OITM,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }
    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert master item batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncBusinessPartner = async () => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
          FROM
              OCRD
      `);
    const result: OCRD[] = requery.recordset;
    const mapResult = result.map((d: OCRD) => {
        const {
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
        } = d;
        const group = {
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
        };
        return group;
    });
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 100) {
        let batch = mapResult.slice(i, i + 100); // get the batch of 50 or less items

        const batchPromises = batch.map(OCRD =>
            prisma.ppic_sap_business_partner.upsert({
                where: { CardCode: OCRD.CardCode },
                create: OCRD,
                update: OCRD,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert business partner batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncPurchaseRequest = async () => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
          FROM
              OPRQ
      `);
    const result = requery.recordset;
    const mapResult = result.map((d: OPRQ) => {
        return {
            Requester: d.Requester,
            ReqName: d.ReqName,
            Branch: d.Branch,
            Department: d.Department,
            DocEntry: d.DocEntry,
            DocNum: d.DocNum,
            DocType: d.DocType,
            CANCELED: d.CANCELED,
            Handwrtten: d.Handwrtten,
            Printed: d.Printed,
            DocStatus: d.DocStatus,
            InvntSttus: d.InvntSttus,
            Transfered: d.Transfered,
            CreateDate: d.CreateDate,
            DocDueDate: d.DocDueDate,
            DocDate: d.DocDate,
            ReqDate: d.ReqDate,
            Comments: d.Comments,
            U_MIS_Approve1: d.U_MIS_approve1,
            U_MIS_Approve2: d.U_MIS_approve2,
            U_MIS_Approve3: d.U_MIS_approve3,
            U_MIS_Approve4: d.U_MIS_approve4,
        };
    });
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 100) {
        let batch = mapResult.slice(i, i + 100); // get the batch of 50 or less items

        const batchPromises = batch.map(oprq =>
            prisma.ppic_sap_purchase_request.upsert({
                where: { DocEntry: oprq.DocEntry },
                create: oprq,
                update: oprq,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert pr batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncPurchaseRequestDocs = async () => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
              FROM
                  PRQ1
          `);
    const result = requery.recordset;
    const mapResult = result.map((d: PRQ1) => {
        const {
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
            UomCode2,
        } = d;
        return {
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
            UomCode2,
        };
    });
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 100) {
        let batch = mapResult.slice(i, i + 100); // get the batch of 50 or less items

        const batchPromises = batch.map(prq1 =>
            prisma.ppic_sap_purchase_request_docs.upsert({
                where: {
                    DocEntry_LineNum: {
                        DocEntry: prq1.DocEntry,
                        LineNum: prq1.LineNum,
                    },
                },
                create: prq1,
                update: prq1,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert pr docs batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncPurchaseOrder = async () => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
              U_MIS_approve3
          FROM
              OPOR
      `);
    const result: OPOR[] = requery.recordset;
    const mapResult = result.map((d: OPOR) => {
        const {
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
            DocTotal,
            VatSum,
            DiscSum,
            PaidToDate,
            VatPaid,
        } = d;
        const group = {
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
            DocTotal,
            VatSum,
            DiscSum,
            PaidToDate,
            VatPaid,
        };
        return group;
    });
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 100) {
        let batch = mapResult.slice(i, i + 100); // get the batch of 50 or less items

        const batchPromises = batch.map(OPOR =>
            prisma.ppic_sap_purchase_order.upsert({
                where: {
                    DocEntry: OPOR.DocEntry,
                },
                create: OPOR,
                update: OPOR,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert po batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncPurchaseOrderDocs = async () => {
    const pool = await poolPromise;
    const requery = await pool.request().query(`
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
            FROM
                POR1
        `);
    const result: POR1[] = requery.recordset;
    const mapResult = result.map((d: POR1) => {
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
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 100) {
        let batch = mapResult.slice(i, i + 100); // get the batch of 50 or less items

        const batchPromises = batch.map(prq1 =>
            prisma.ppic_sap_purchase_order_docs.upsert({
                where: {
                    DocEntry_LineNum: {
                        DocEntry: prq1.DocEntry,
                        LineNum: prq1.LineNum,
                    },
                },
                create: prq1,
                update: prq1,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert po docs, batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
};

export const SyncGoodsReceipt = async () => {
    const pool = await poolPromise;
    const query = await pool.request().query(`select * from OPDN`)
    const mapResult: OPDN[] = query.recordset;
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 50) {
        let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

        const batchPromises = batch.map(opdn =>
            prisma.ppic_sap_goods_receipt_po.upsert({
                where: {
                    DocEntry: opdn.DocEntry
                },
                create: opdn,
                update: opdn,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert from sap grpo to our db batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
}

export const SyncGoodsReceiptDocs = async () => {
    const pool = await poolPromise;
    const query = await pool.request().query(`
        select * from PDN1 
          WHERE
        ItemCode LIKE '10%' 
          OR ItemCode LIKE '11%'
          OR ItemCode LIKE '20%'
          OR ItemCode LIKE '40%'
      `)
    const mapResult: PDN1[] = query.recordset;
    const promiseBatches = []; // to hold all batches of promises

    for (let i = 0; i < mapResult.length; i += 50) {
        let batch = mapResult.slice(i, i + 50); // get the batch of 50 or less items

        const batchPromises = batch.map(pdn1 =>
            prisma.ppic_sap_goods_receipt_po_docs.upsert({
                where: {
                    DocEntry_LineNum: {
                        DocEntry: pdn1.DocEntry,
                        LineNum: pdn1.LineNum
                    }
                },
                create: pdn1,
                update: pdn1,
            })
        );

        promiseBatches.push(batchPromises); // push the batch of promises into the batches array
    }

    let i = 0;
    for (const batch of promiseBatches) {
        i++;
        console.log('Processing insert from sap grpo docs to our db batch ', i, batch.length)
        await Promise.all(batch); // process each batch separately
    }
}