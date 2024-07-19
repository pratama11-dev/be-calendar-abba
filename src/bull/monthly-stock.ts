import { PrismaClient } from "@prisma/client";
import moment from "moment";
import { DateUtil } from "../Utils/dateUtils";

export const doMonthlyStockSync = async (input: { type?: string }, prisma: PrismaClient) => {
    const existingStock = await prisma.ppic_inventory_stock.findFirst({
        where: {
            type: input?.type,
            AND: [
                {
                    created_at: {
                        gte: moment().startOf('month').toDate(),
                        lt: moment().endOf('month').toDate()
                    }
                }
            ]
        }

    });

    if (existingStock) {
        throw new Error("Inventory stock for this type and month already exists!");
    }

    // create inventory stock
    const InventoryStock = await prisma.ppic_inventory_stock.create({
        data: {
            created_at: DateUtil?.CurDate(),
            type: input?.type
        }
    })

    const result = await (async () => {
        if (input?.type == "po") {
            const data = await prisma.$queryRaw`
          SELECT
              penerimaan.*,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi_active
          FROM
            (
                SELECT
                    po.DocNum,
                    bp.CardName,
                    pdb.id AS id_delivery_docs_batch,
                    d.batchNumber,
                    pdb.status_grpo,
                    pdb.lot,
                    d.is_migrate,
                    FORMAT ( d.received_shipment_date, 'dd/MM/yyyy' ) AS received_date,
                    mi.ItemCode,
                    mi.ItemName,
                    wt.qty_case AS [total_case_penerimaan],
                    ( wt.jumlah_cones * wt.qty_case ) AS [total_cones_penerimaan],
                    ( wt.average_netto_according_suplier * wt.qty_case ) AS [total_netto_supplier_penerimaan],
                    ( wt.average_netto * wt.qty_case ) AS [total_netto_penerimaan],
                    retur.qty_in_kg AS qty_retur,
                    retur.total_cones AS cones_retur,
                    retur.total_box AS box_retur
                FROM
                    ppic.ppic_delivery d
                    JOIN ppic.ppic_master_document md ON d.id_master_document = md.id
                    JOIN ppic.ppic_master_document_docs mddoc ON md.id = mddoc.id_master_document
                    JOIN ppic.ppic_sap_purchase_order po ON po.DocEntry = md.sap_doc_entry_po
                    JOIN ppic.ppic_delivery_docs pdd ON pdd.id_delivery = d.id 
                    AND mddoc.id = pdd.id_master_document
                    JOIN ppic.ppic_delivery_docs_batch pdb ON pdb.id_delivery_docs = pdd.id 
                    AND pdb.status_timbang= 4
                    LEFT JOIN ppic.ppic_return_document_doc_batch retur on pdb.id = retur.id_lot
                    JOIN ppic.ppic_sap_master_item mi ON mi.ItemCode = pdd.ItemCode
                    JOIN ppic.ppic_test_result_weight wt ON wt.id_delivery_docs_batch = pdb.id
                    join ppic.ppic_sap_business_partner bp on bp.CardCode=d.card_code
            ) AS penerimaan
            LEFT JOIN ppic.ppic_item_box ibox ON ibox.id_delivery_docs_batch= penerimaan.id_delivery_docs_batch and penerimaan.ItemCode=ibox.ItemCode
          GROUP BY
            penerimaan.DocNum,
            penerimaan.CardName,
            penerimaan.id_delivery_docs_batch,
            penerimaan.batchNumber,
            penerimaan.lot,
            penerimaan.qty_retur,
            penerimaan.cones_retur,
            penerimaan.box_retur,
            penerimaan.is_migrate,
            penerimaan.status_grpo,
            penerimaan.received_date,
            penerimaan.ItemCode,
            penerimaan.ItemName,
            penerimaan.total_case_penerimaan,
            penerimaan.total_cones_penerimaan,
            penerimaan.total_netto_supplier_penerimaan,
            penerimaan.total_netto_penerimaan
          `;

            const dataMultiple = await prisma.$queryRaw`
          SELECT
              penerimaan.*, 
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active, 
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed, 
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost, 
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur, 
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi_active, 
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active, 
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed, 
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost, 
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur, 
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi_active, 
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active, 
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed, 
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost, 
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur, 
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi, 
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi_active
          FROM
              (
                  SELECT
                      po.DocNum, 
                      bp.CardName, 
                      pdb.id AS id_delivery_docs_batch, 
                      d.batchNumber, 
                      pdb.status_grpo, 
                      pdb.lot, 
                      d.is_migrate, 
                      FORMAT ( d.received_shipment_date, 'dd/MM/yyyy' ) AS received_date, 
                      mi.ItemCode, 
                      mi.ItemName, 
                      wt.qty_case AS total_case_penerimaan, 
                      ( wt.jumlah_cones * wt.qty_case ) AS total_cones_penerimaan, 
                      ( wt.average_netto_according_suplier * wt.qty_case ) AS total_netto_supplier_penerimaan, 
                      ( wt.average_netto * wt.qty_case ) AS total_netto_penerimaan,
                      retur.qty_in_kg AS qty_retur,
                      retur.total_cones AS cones_retur,
                      retur.total_box AS box_retur
                  FROM
                      ppic.ppic_delivery AS d
                      JOIN ppic.ppic_multiple_po_delivery AS mpod ON d.id = mpod.id_delivery
                      JOIN ppic.ppic_master_document AS md ON mpod.id_master_document = md.id
                      JOIN ppic.ppic_master_document_docs AS mddoc ON md.id = mddoc.id_master_document
                      JOIN ppic.ppic_sap_purchase_order AS po ON po.DocEntry = md.sap_doc_entry_po
                      JOIN ppic.ppic_delivery_docs AS pdd ON pdd.id_delivery = d.id
                      JOIN ppic.ppic_delivery_docs_batch AS pdb ON pdb.id_delivery_docs = pdd.id AND pdb.status_timbang = 4
                      LEFT JOIN ppic.ppic_return_document_doc_batch retur on pdb.id = retur.id_lot
                      JOIN ppic.ppic_sap_master_item AS mi ON mi.ItemCode = pdd.ItemCode
                      JOIN ppic.ppic_test_result_weight AS wt ON wt.id_delivery_docs_batch = pdb.id
                      JOIN ppic.ppic_sap_business_partner AS bp ON bp.CardCode = d.card_code
                      WHERE
                          mddoc.ItemCode = pdd.ItemCode
              ) AS penerimaan
              LEFT JOIN
              ppic.ppic_item_box AS ibox
              ON 
                  ibox.id_delivery_docs_batch = penerimaan.id_delivery_docs_batch AND
                  penerimaan.ItemCode = ibox.ItemCode
          GROUP BY
              penerimaan.DocNum, 
              penerimaan.CardName, 
              penerimaan.id_delivery_docs_batch, 
              penerimaan.batchNumber, 
              penerimaan.lot, 
              penerimaan.qty_retur,
              penerimaan.cones_retur,
              penerimaan.box_retur,
              penerimaan.is_migrate, 
              penerimaan.status_grpo, 
              penerimaan.received_date, 
              penerimaan.ItemCode, 
              penerimaan.ItemName, 
              penerimaan.total_case_penerimaan, 
              penerimaan.total_cones_penerimaan, 
              penerimaan.total_netto_supplier_penerimaan, 
              penerimaan.total_netto_penerimaan
          `;
            return { data, dataMultiple };
        }

        if (input?.type == "so") {
            const data = await prisma.$queryRaw`
          SELECT
              penerimaan.*,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi_active
          FROM
          (
            SELECT
                so.DocNum,
                bp.CardName,
                pdb.id AS id_delivery_docs_batch,
                d.batchNumber,
                pdb.status_grpo,
                pdb.lot,
                d.is_migrate,
                FORMAT ( d.received_shipment_date, 'dd/MM/yyyy' ) AS received_date,
                mi.ItemCode,
                mi.ItemName,
                wt.qty_case AS [total_case_penerimaan],
                ( wt.jumlah_cones * wt.qty_case ) AS [total_cones_penerimaan],
                ( wt.average_netto_according_suplier * wt.qty_case ) AS [total_netto_supplier_penerimaan],
                ( wt.average_netto * wt.qty_case ) AS [total_netto_penerimaan],
                retur.qty_in_kg AS qty_retur,
                retur.total_cones AS cones_retur,
                retur.total_box AS box_retur
            FROM
                ppic.ppic_delivery d
                JOIN ppic.ppic_master_document md ON d.id_master_document = md.id
                JOIN ppic.ppic_master_document_docs mddoc ON md.id = mddoc.id_master_document
                JOIN ppic.ppic_sap_sales_order so ON so.DocEntry = md.sap_doc_entry_so
                JOIN ppic.ppic_delivery_docs pdd ON pdd.id_delivery = d.id 
                AND mddoc.id = pdd.id_master_document
                JOIN ppic.ppic_delivery_docs_batch pdb ON pdb.id_delivery_docs = pdd.id 
                AND pdb.status_timbang= 4
                LEFT JOIN ppic.ppic_return_document_doc_batch retur on pdb.id = retur.id_lot
                JOIN ppic.ppic_sap_master_item mi ON mi.ItemCode = pdd.ItemCode
                JOIN ppic.ppic_test_result_weight wt ON wt.id_delivery_docs_batch = pdb.id
                join ppic.ppic_sap_business_partner bp on bp.CardCode=d.card_code
          ) AS penerimaan
            LEFT JOIN ppic.ppic_item_box ibox ON ibox.id_delivery_docs_batch= penerimaan.id_delivery_docs_batch and penerimaan.ItemCode=ibox.ItemCode
          GROUP BY
            penerimaan.DocNum,
            penerimaan.CardName,
            penerimaan.id_delivery_docs_batch,
            penerimaan.batchNumber,
            penerimaan.lot,
            penerimaan.qty_retur,
            penerimaan.cones_retur,
            penerimaan.box_retur,
            penerimaan.is_migrate,
            penerimaan.status_grpo,
            penerimaan.received_date,
            penerimaan.ItemCode,
            penerimaan.ItemName,
            penerimaan.total_case_penerimaan,
            penerimaan.total_cones_penerimaan,
            penerimaan.total_netto_supplier_penerimaan,
            penerimaan.total_netto_penerimaan
          `;

            const dataMultiple = await prisma.$queryRaw`
          SELECT
              penerimaan.*,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi_active
          FROM
              (
                  SELECT
                      so.DocNum,
                      bp.CardName,
                      pdb.id AS id_delivery_docs_batch,
                      d.batchNumber,
                      pdb.status_grpo,
                      pdb.lot,
                      d.is_migrate,
                      FORMAT ( d.received_shipment_date, 'dd/MM/yyyy' ) AS received_date,
                      mi.ItemCode,
                      mi.ItemName,
                      wt.qty_case AS [total_case_penerimaan],
                      ( wt.jumlah_cones * wt.qty_case ) AS [total_cones_penerimaan],
                      ( wt.average_netto_according_suplier * wt.qty_case ) AS [total_netto_supplier_penerimaan],
                      ( wt.average_netto * wt.qty_case ) AS [total_netto_penerimaan],
                      retur.qty_in_kg AS qty_retur,
                      retur.total_cones AS cones_retur,
                      retur.total_box AS box_retur
                  FROM
                      ppic.ppic_delivery d
                      JOIN ppic.ppic_multiple_so_delivery AS mpod ON d.id = mpod.id_delivery
                      JOIN ppic.ppic_master_document md ON mpod.id_master_document = md.id
                      JOIN ppic.ppic_master_document_docs mddoc ON md.id = mddoc.id_master_document
                      JOIN ppic.ppic_sap_sales_order so ON so.DocEntry = md.sap_doc_entry_so
                      JOIN ppic.ppic_delivery_docs pdd ON pdd.id_delivery = d.id 
                      AND mddoc.id = pdd.id_master_document
                      JOIN ppic.ppic_delivery_docs_batch pdb ON pdb.id_delivery_docs = pdd.id 
                      AND pdb.status_timbang= 4
                      LEFT JOIN ppic.ppic_return_document_doc_batch retur on pdb.id = retur.id_lot
                      JOIN ppic.ppic_sap_master_item mi ON mi.ItemCode = pdd.ItemCode
                      JOIN ppic.ppic_test_result_weight wt ON wt.id_delivery_docs_batch = pdb.id
                      join ppic.ppic_sap_business_partner bp on bp.CardCode=d.card_code
                      WHERE
                          mddoc.ItemCode = pdd.ItemCode
              ) AS penerimaan
              LEFT JOIN ppic.ppic_item_box ibox ON ibox.id_delivery_docs_batch= penerimaan.id_delivery_docs_batch and penerimaan.ItemCode=ibox.ItemCode
          GROUP BY
              penerimaan.DocNum,
              penerimaan.CardName,
              penerimaan.id_delivery_docs_batch,
              penerimaan.batchNumber,
              penerimaan.lot,
              penerimaan.qty_retur,
              penerimaan.cones_retur,
              penerimaan.box_retur,
              penerimaan.is_migrate,
              penerimaan.status_grpo,
              penerimaan.received_date,
              penerimaan.ItemCode,
              penerimaan.ItemName,
              penerimaan.total_case_penerimaan,
              penerimaan.total_cones_penerimaan,
              penerimaan.total_netto_supplier_penerimaan,
              penerimaan.total_netto_penerimaan
          `;
            return { data, dataMultiple };
        }

        // bikin yang yd
        if (input?.type == "yd") {
            const data = await prisma.$queryRaw`
          SELECT
            penerimaan.*,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi_active,
              SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active,
              SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed,
              SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost,
              SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur,
              SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi,
              SUM ( CASE WHEN ibox.is_sisa_produksi = 1 AND ibox.id_status = 1 THEN 1 ELSE 0 END ) AS total_case_sisa_produksi_active 
              FROM
                (
                  SELECT
                    bp.CardName,
                    md.ref_op,
                    pdb.id AS id_delivery_docs_batch,
                    d.batchNumber,
                    pdb.status_grpo,
                    pdb.lot,
                    pdd.color,
                    d.is_migrate,
                    FORMAT ( d.received_shipment_date, 'dd/MM/yyyy' ) AS received_date,
                    mi.ItemCode,
                    mi.ItemName,
                    wt.qty_case AS [total_case_penerimaan],
                    ( wt.jumlah_cones * wt.qty_case ) AS [total_cones_penerimaan],
                    ( wt.average_netto_according_suplier * wt.qty_case ) AS [total_netto_supplier_penerimaan],
                    ( wt.average_netto * wt.qty_case ) AS [total_netto_penerimaan],
                    retur.qty_in_kg AS qty_retur,
                    retur.total_cones AS cones_retur,
                    retur.total_box AS box_retur
                  FROM
                    ppic.ppic_delivery d
                    JOIN ppic.ppic_master_document md ON d.id_master_document = md.id
                    -- JOIN ppic.ppic_inventory_transfer_yarn_dyed po ON md.id_yd_po = po.id
                    JOIN ppic.ppic_delivery_docs pdd ON pdd.id_delivery = d.id 
                    JOIN ppic.ppic_delivery_docs_batch pdb ON pdb.id_delivery_docs = pdd.id 
                    -- AND pdb.status_timbang= 4
                    LEFT JOIN ppic.ppic_return_document_doc_batch retur on pdb.id = retur.id_lot
                    JOIN ppic.ppic_sap_master_item mi ON mi.ItemCode = pdd.ItemCode AND pdd.ItemCode LIKE '20%' 
                    JOIN ppic.ppic_test_result_weight wt ON wt.id_delivery_docs_batch = pdb.id
                    JOIN ppic.ppic_sap_business_partner bp ON bp.CardCode= d.card_code AND bp.CardCode= 'C110314'
                ) AS penerimaan
                LEFT JOIN ppic.ppic_item_box ibox ON ibox.id_delivery_docs_batch= penerimaan.id_delivery_docs_batch 
                AND penerimaan.ItemCode= ibox.ItemCode 
                -- AND ibox.qr_code LIKE '3%'
              GROUP BY
                penerimaan.CardName,
                penerimaan.ref_op,
                penerimaan.id_delivery_docs_batch,
                penerimaan.batchNumber,
                penerimaan.lot,
                penerimaan.qty_retur,
                penerimaan.cones_retur,
                penerimaan.box_retur,
                penerimaan.color,
                penerimaan.is_migrate,
                penerimaan.status_grpo,
                penerimaan.received_date,
                penerimaan.ItemCode,
                penerimaan.ItemName,
                penerimaan.total_case_penerimaan,
                penerimaan.total_cones_penerimaan,
                penerimaan.total_netto_supplier_penerimaan,
                penerimaan.total_netto_penerimaan
          `;
            return { data };
        }
    })();

    for (const loopData of result?.data as any) {
        await prisma.ppic_inventory_stock_docs.create({
            data: {
                id_inventory_stock: InventoryStock?.id,
                DocNum: loopData.DocNum,
                CardName: loopData.CardName,
                id_delivery_docs_batch: loopData.id_delivery_docs_batch,
                batchNumber: loopData.batchNumber,
                status_grpo: loopData.status_grpo,
                lot: loopData.lot,
                is_migrate: loopData.is_migrate,
                received_date: loopData.received_date,
                ItemCode: loopData.ItemCode,
                ItemName: loopData.ItemName,
                total_case_penerimaan: parseInt(loopData.total_case_penerimaan),
                total_cones_penerimaan: parseInt(loopData.total_cones_penerimaan),
                total_netto_supplier_penerimaan: parseFloat(loopData.total_netto_supplier_penerimaan),
                total_netto_penerimaan: parseFloat(loopData.total_netto_penerimaan),
                total_netto_in_kg_active: parseFloat(loopData.total_netto_in_kg_active),
                total_netto_consumed: parseFloat(loopData.total_netto_consumed),
                total_netto_lost: parseFloat(loopData.total_netto_lost),
                total_netto_retur: parseFloat(loopData.total_netto_retur + loopData?.qty_retur),
                total_netto_consumed_yd: parseFloat(loopData.total_netto_consumed_yd),
                total_netto_sisa_produksi: parseFloat(loopData.total_netto_sisa_produksi),
                total_netto_sisa_produksi_active: parseFloat(loopData.total_netto_sisa_produksi_active),
                total_cones_active: parseInt(loopData.total_cones_active),
                total_cones_consumed: parseInt(loopData.total_cones_consumed),
                total_cones_lost: parseInt(loopData.total_cones_lost),
                total_cones_retur: parseInt(loopData.total_cones_retur + loopData?.cones_retur),
                total_cones_consumed_yd: parseInt(loopData.total_cones_consumed_yd),
                total_cones_sisa_produksi: parseInt(loopData.total_cones_sisa_produksi),
                total_cones_sisa_produksi_active: parseInt(loopData.total_cones_sisa_produksi_active),
                total_case_active: loopData.total_case_active,
                total_case_consumed: loopData.total_case_consumed,
                total_case_lost: loopData.total_case_lost,
                total_case_retur: parseInt(loopData.total_case_retur + loopData?.box_retur),
                total_case_consumed_yd: loopData.total_case_consumed_yd,
                total_case_sisa_produksi: loopData.total_case_sisa_produksi,
                total_case_sisa_produksi_active: loopData.total_case_sisa_produksi_active,
                periode: moment().toISOString(),
                type: input?.type
            }
        })
    }

    if (input?.type != "yd") {
        for (const loopData of result?.dataMultiple as any) {
            await prisma.ppic_inventory_stock_docs.create({
                data: {
                    id_inventory_stock: InventoryStock?.id,
                    DocNum: loopData.DocNum,
                    CardName: loopData.CardName,
                    id_delivery_docs_batch: loopData.id_delivery_docs_batch,
                    batchNumber: loopData.batchNumber,
                    status_grpo: loopData.status_grpo,
                    lot: loopData.lot,
                    is_migrate: loopData.is_migrate,
                    received_date: loopData.received_date,
                    ItemCode: loopData.ItemCode,
                    ItemName: loopData.ItemName,
                    total_case_penerimaan: parseInt(loopData.total_case_penerimaan),
                    total_cones_penerimaan: parseInt(loopData.total_cones_penerimaan),
                    total_netto_supplier_penerimaan: parseFloat(loopData.total_netto_supplier_penerimaan),
                    total_netto_penerimaan: parseFloat(loopData.total_netto_penerimaan),
                    total_netto_in_kg_active: parseFloat(loopData.total_netto_in_kg_active),
                    total_netto_consumed: parseFloat(loopData.total_netto_consumed),
                    total_netto_lost: parseFloat(loopData.total_netto_lost),
                    total_netto_retur: parseFloat(loopData.total_netto_retur + loopData?.qty_retur),
                    total_netto_consumed_yd: parseFloat(loopData.total_netto_consumed_yd),
                    total_netto_sisa_produksi: parseFloat(loopData.total_netto_sisa_produksi),
                    total_netto_sisa_produksi_active: parseFloat(loopData.total_netto_sisa_produksi_active),
                    total_cones_active: parseInt(loopData.total_cones_active),
                    total_cones_consumed: parseInt(loopData.total_cones_consumed),
                    total_cones_lost: parseInt(loopData.total_cones_lost),
                    total_cones_retur: parseInt(loopData.total_cones_retur + loopData?.cones_retur),
                    total_cones_consumed_yd: parseInt(loopData.total_cones_consumed_yd),
                    total_cones_sisa_produksi: parseInt(loopData.total_cones_sisa_produksi),
                    total_cones_sisa_produksi_active: parseInt(loopData.total_cones_sisa_produksi_active),
                    total_case_active: loopData.total_case_active,
                    total_case_consumed: loopData.total_case_consumed,
                    total_case_lost: loopData.total_case_lost,
                    total_case_retur: parseInt(loopData.total_case_retur + loopData?.box_retur),
                    total_case_consumed_yd: loopData.total_case_consumed_yd,
                    total_case_sisa_produksi: loopData.total_case_sisa_produksi,
                    total_case_sisa_produksi_active: loopData.total_case_sisa_produksi_active,
                    periode: moment().toISOString(),
                    type: input?.type
                }
            })
        }
    }
}