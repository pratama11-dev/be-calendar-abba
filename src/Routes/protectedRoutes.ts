import { Router } from 'express';
import passport from 'passport';
import { checkAuth } from '../Middleware/checkAuth';

import {
    getStatusDelivery,
    getStatusMasterDocuments,
    getTypeDelivery,
    getTypeMasterDocuments
} from '../Controllers/TypeAndStatus';

import {
    getDetailPurchaseOrder,
    getDetailSalesOrderSingle,
    getSapBusPartner,
    getSapMasterItem,
    getSapPoWithDelivery,
    getSapPurchaseOrder,
    getSapPurchaseOrderForReturn,
    getSapPurchaseRequest,
    getSapSalesOrder,
    getSapSalesOrderDoc,
    getSapSalesOrderDocDetail,
    getSapSalesOrderForMigrate,
    getSapSalesOrderForReturn,
    getSapSalesOrderForSisaProduksi,
    getSapSalesOrderForSupply,
    getSapSalesOrderForYarnDyed
} from '../Controllers/SAP';

import {
    PrintQrCodeLocation,
    addOpnameLostItem,
    doFinishOpname,
    doLostAndFound,
    doOpname,
    exportExcelOpname,
    getItemByPallet,
    getItemOpname,
    getListWarehouseForOpname,
    getOpname,
    getWarehouse,
    getWarehouseAndPalletLocationByLot,
    getWarehouseDetail,
    getWarehouseForDataTables,
    newWarehouseMaklon,
    newWarehouseSpandex,
    scanQrCodeWarehouse,
    syncWarehouse,
    syncWarehouseCikampek
} from '../Controllers/WHRM/Warehouse';

import { startSyncSAPQueue } from '../Controllers/SAPSyncController';

import {
    DeliveryDocsBatch,
    DeliveryDocsBatchDetail,
    DeliveryDocsDetail,
    Gewinn2,
    ReceiveAndGewinn1,
    addInbound,
    changeDocnum,
    connectBatchDeliveryWithMultiSO,
    connectDeliveryToMultiplePo,
    connectDeliveryToPo,
    connectMaklonDelivery,
    countPenerimaan,
    createBatchDelivery,
    createBatchDeliverySecondary,
    createBatchDeliveryWithMultiPO,
    createBatchDeliveryWithMultiSO,
    createMaklonDelivery,
    createMultiSuratJalan,
    createPDFBPB,
    createPDFBPBMultiV2,
    createPDFBatchDelivery,
    createPDFBatchDeliveryFromMaster,
    createPDFGewinn,
    createPDFGewinnMulti,
    createPDFGewinnMultiV2,
    createUnplannedASN,
    deleteDelivery,
    deleteDeliveryItem,
    getBatchDelivery,
    getBatchDeliveryByBatch,
    getBatchDeliveryForGuards,
    getBatchDeliveryForGuards2,
    getBatchDeliveryForGuards3,
    getDataInshipmentForMultiPO,
    getDeliveryByMasterDocuments,
    getDeliveryInboundByID,
    getDocsByMasterDocument,
    getInboundDelivery,
    getMultiGewinn,
    getSuratJalan,
    historyInboundDelivery,
    moveCardCodeToDelivery,
    multiGewinn2,
    scanQrASN, tesCountYarnDyedDelivery, unplannedASNwithMultiGewinn, updateInitialDelivery, updateInitialDeliveryMaklon, updateStatusDelivery
} from '../Controllers/AdvanceShipment';

import {
    getWeightTest,
    addWeightTestLot,
    getWeightTestDetail,
    editWeightTestHeader,
    addWeightTestDocBulk,
    addWeightTestDoc,
    deleteWeightTestDoc,
    editWeightTestDoc,
    finalizeWeightTest,
    getWeightTestASN,
    createPDFDetailWeightTest,
} from '../Controllers/WHRM/WeightTest';

import {
    KnitTestGeneralList,
    KnitTestAvailableList,
    addKnitTest,
    updateKnitTest,
    KnitTestListForApproval,
    ApproveMachineKnitTest,
    KnitTestListForTake,
    AddKnitTestDocSingle,
    AddKnitTestDocYCSSSingle,
    EditKnitTestDocSingle,
    EditKnitTestDocYCSSSingle,
    DeleteKnitTestDoc,
    DeleteKnitTestYCSSDoc,
    KnitTestDetail,
    FinalizeKnitTest,
    KnitTestListHistory,
    GetKnitTestDocs,
    createPDFDetailKnitTest,
    RetestKnitting,
    HistoryKnitTest,
} from '../Controllers/WHRM/KnitTest';

import {
    DeliverDyeingTest,
    DyeingTestDetail,
    DyeingTestGeneralList,
    DyeingTestHistory,
    DyeingTestReadyToFinalize,
    FinalizeDyeingTest,
    GetDyeingTestAlreadyShip,
    GetDyeingTestReadyToShipList,
    HistoryDyeingTest,
    ReceiveDyeGreigeAndTestIt,
    RetestDyeing,
    createPDFDetailDyeingTest,
    doReceiveYarnInCikampek,
    doSentSampleToCikawung,
    getForPGToSent,
    getForPgToReceive,
    getHistoryPG
} from '../Controllers/WHRM/DyeingTest';

import {
    ListDeliveryForGRPO,
    ListDeliveryForGRPOMaklon,
    ProceedGRPO,
    ProceedQR,
    UpdateNomerKendaraan,
    addItemsForRetur,
    addLotReturGRPO,
    countAllReturForMobile,
    createReturGRPO,
    deleteItemInRetur,
    deleteLotInRetur,
    deleteReturnGRPO,
    exportReturDetail,
    exportSuratJalan,
    finalizeRetur,
    getItemsForRetur,
    getItemsInRetur,
    getItemsInReturByDocBatch,
    getListLotForGRPO,
    getReturDetail,
    getReturDocumentForApps,
    getReturItems,
    getReturList
} from '../Controllers/WHRM/GRPO';

import {
    AddPallet,
    AddPalletCKP,
    GetPallet,
    GetPalletDetail,
    GetPalletMoveHistory,
    UpdatePalletStatusBulk,
    getPalletDummy,
    movePalletToNewLocation,
    printQrCodePallet,
    scanQrCodePallet
} from '../Controllers/WHRM/Pallet';

import {
    AddBox,
    DeleteBox,
    GetBox,
    UpdateBox
} from '../Controllers/WHRM/Box';

import {
    CountDeliveryStatus,
    CountDeliveryTransaction,
    CountDeliveryType,
    CountInventoryTransfer,
    CountInventoryWHRM, CountItemBoxStatus, CountSupplyYD
} from '../Controllers/WHRM/Dashboard';

import {
    GetItemByIDDeliveryDocBatch,
    ListItem,
    PrintQrCodeItems,
    scanQrCodeItem,
    moveItemToOtherPallet,
    SplitItems,
    SetBoxToItem,
    getDeliveryDocBatchForSupply,
    getSupplyTempBySO,
    doSupplyWithSO,
    listSupply,
    listSupplyItemBoxBySupplyDoc,
    addTempSupplyLotBenang,
    getTempSupplyLotBenang,
    clearTempSupplyLot,
    deleteTempSupplyLot,
    getItemForSupply,
    AddTempItemSupply,
    GetTempItemSupply,
    clearTempSupplyItem,
    deleteTempSupplyItem,
    cariDataSOdenganItemCode,
    markForMoveToShopFloor,
    markDeliveredToShopFloor,
    GetAgingTable,
    exportItemSupply,
    AddSisaProduksi,
    getBatchLot,
    geLot,
    getPDO,
    markItemReturned,
    markDeliveredToShopFloorV2,
    markDeliveredToShopFloorV2Pallet,
    ExportPDFReceiveItemByLOT,
    ExportExcelReceiveItemByLOT,
    getDeliveryDocBatchForSupplyYarnDyed,
    addSupplyLotBenangYarnDyed,
    getDeliveryDocBatchInSupplyYarnDyed,
    RemoveSupplyLotBenangYarnDyed,
    markDeliveredToYarnDyed,
    markDeliveredToYarnDyedPallet,
    markDeliveredToReturnV2,
    markDeliveredToReturnPallet,
    DeleteItems,
    markDeliveredToShopFloorV2MultiSO,
    ItemBoxDetail,
    adjNettoItemBox,
    editSupplyDocs,
    resyncItemBatchAfterConsume,
    returnWithoutItem,
    getItemPDO,
    addInventoryStock,
    getInventoryStock,
    addConsignerItemSupply,
    markDeliveredToShopfloorWithMissingItem,
    listDocSupply,
    doSupplyWhse,
    addItemWhse,
    exportSuratJalanWhse,
    UpdateNomerKendaraanWhse,
    addItemWhseByPallet,
    countSupplySasaranMutu,
    resyncInventoryStock,
} from '../Controllers/WHRM/Item';

import {
    AcceptTFSupply,
    CountSupplyDocForWhrm,
    addLotToSupplyDoc,
    addSupplyDocsInventoryTf,
    countSupply,
    getDetailInventoryTransfer,
    getRegularYarnKnitMaklonSoForMobile,
    getRegularYarnKnitRegularSoForMobile,
    getRegularYarnKnitWhseSoForMobile,
    getTemporaryDataItem,
    getTemporaryDataLot,
    getYarnDyedForMobile,
    getYarnDyedItemBySO,
    getYarnKnitItemBySO,
    listInventoryTfSupplyDocsBatch,
    printSuratJalan,
    updateStatusTransfer
} from '../Controllers/WHRM/Supply';

import {
    DeleteSafetyStock,
    // GetSafetyStocks,
    GetSafetyStocksV2,
    UpdateSafetyStock,
    addSafetyDoc,
    findLotFromItem
} from '../Controllers/WHRM/SafetyStock';

import {
    getCountShopFloor,
    getDelivered,
    getOnDelivery
} from '../Controllers/WHRM/shop-floor';
// import {
//     ListAgingStock
// } from '../Controllers/AgingStock';
import {
    AddPoDocYarnDyed,
    AddYarnDyedRawMaterial,
    CreatePOYarnDyed,
    EditShipmentDetailYarnDyed,
    EditShipmentStatusYarnDyed,
    GetItemForYarnDyed,
    GetPOYarnDyed,
    GetPOYarnDyedDetail,
    GetPOYarnDyedForReturn,
    GetYarnDyedDelivery,
    GetYarnDyedDeliveryDetail,
    GetYarnDyedRawMaterial,
    GetYarnDyedRawMaterialForDelivery,
    addNewYarnDyedDelivery,
    addYarnDyedRawMaterialToShipment,
    consumeItemForYd,
    consumeItemForYdWithPallet,
    deletePOYarnDyed,
    deleteYarnDyedDoc,
    deleteYarnDyedItem,
    exportPOYarnDyed,
    finalizeDelivery,
    finalizePO,
    generateNumberPOYarnDyed,
    getDeliveryRMItem,
    getDeliveryRMItemWhole,
    pickUpYarnDyedItem,
    cekPallet,
    receiveItemYd,
    cekReceiveYdReg,
    consumeYdRegular,
    finalizeYdRegular,
    acceptHalfYdReg,
    getSapSalesOrderForYarnDyedMaklon,
    getLastDataIbox,
    getYdRmV2
} from '../Controllers/YarnDyed';

import { getExperiment } from '../Controllers/Experiment';
import { GetJobs, OriGenerateQRCode, RenameLot, cekItem, cekItemInStagging, clearAllPlannedDeliveryWithNoItem, clearPalletWhenItemLost, deleteDeliveryWithFollowingData, deleteMissingItemInSupply, doFormatCardCode, fixIrregularItemNotConsume, fixSisaProduksiDimensi, fixingIrregularItemAfterConsume, fixingOpname, fixlocationItemAfterConsume, getItemLostInOpnameToFound, getJobLogs, getStockWithItemCodeLama, handlerOutstandingBox, insetIdDeliveryBatchInOpname, irregularItemAfter, listIrregularPallet, manSyncSOHttp, manualSyncPurchaseOrder, manualSyncSalesOrder, mappingTFSupply, moveItemCodeToNewItemCode, moveMissingItemToMissingZone, movePalletIdletoPeralatan, pindahinOrphanItem, pindahinOrphanPallet, resyncSupplyDocs, resyncWarehouse, tesExcel } from '../Controllers/Util';
import { doMigrasi, doMigrasiMaklon, doMigrasiYd, findPOForMigrasi } from '../Controllers/WHRM/Migrasi';
import { ExportExcellReportPersediaanYarnDyed, ExportPDFReportPersediaanYarnDyed, ReportPersediaanYarnDyed, ReportReceiveItemByPO, ReportReceiveItemBySO, PenerimaanYarn, StatusStockAndPO, outstandingPO, YarnSupplyByDate, getTransactionLot, getQualityReport, getSpaceUtilizationReport, StatusStockAndSO, StatusStockYd, getTransactionYd, PenerimaanYarnMaklon } from '../Controllers/WHRM/Report';
import { getSerialPortData } from '../Controllers/WHRM/SerialPort';
import { getSupplier } from '../Controllers/WHRM/Supplier';
import { addOpnameZone, addStockOpname, backdoorDocStockOpname, backdoorStockOpname, completeOpnamePalletV2, cuntSasaranMutuOpname, deleteOpname, detailStockOpname, listStockOpname, updateBatchNetto, updateDataOpname } from '../Controllers/WHRM/StockOpname';
import { reportsMovingAveragePoPrice, reportsMovingAveragePoPriceV2, reportsMovingAveragePriceV3 } from '../Controllers/Price/AvgPrice';
// import { createExcel } from '../Utils/docUtil';

const router = Router();

// Add passport middleware for JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

// experimenting
// router.post("/exp", reportsMovingAveragePoPriceV2)

router.get('/get-session', checkAuth(), (req, res) => {
    res.json(req.user);
});
// per type dan status an
router.get('/md-type', getTypeMasterDocuments)
router.get('/md-status', getStatusMasterDocuments)

router.get('/delivery-type', getTypeDelivery)
router.get('/delivery-status', getStatusDelivery)

// supplier
router.post('/supplier', getSupplier)

// per sap an
router.post('/sap-po', getSapPurchaseOrder)
router.post("/sap/po/with-delivery", getSapPoWithDelivery);
router.post('/sap-pr', getSapPurchaseRequest)
router.post('/sap-master-items', getSapMasterItem)
router.post('/sap-bus-partner', getSapBusPartner)
router.post('/sync-sap', startSyncSAPQueue)
router.post('/sap-so', getSapSalesOrder)
router.get("/sap-so/detail/:id", getDetailSalesOrderSingle)
router.get("/sap-po/detail/:id", getDetailPurchaseOrder)
router.post("/sap-so-doc/detail", getSapSalesOrderDocDetail)
router.post("/sap-so-doc", getSapSalesOrderDoc)
router.post("/sap-so-for-yarn-dyed", getSapSalesOrderForYarnDyed);

// sync sap
router.post("/sap/man-sync-po", manualSyncPurchaseOrder);
router.post("/sap/man-sync-so", manualSyncSalesOrder);
router.post("/sap/man-sync-so-http", manSyncSOHttp);

router.post("/get-jobs", GetJobs)
router.post("/get-job-logs", getJobLogs)

// generic lot and pdo
router.post('/lot', geLot)
router.post('/pdo', getPDO)
router.post('/pdo-item', getItemPDO)
router.post("/warehouse-and-pallet/by-lot", getWarehouseAndPalletLocationByLot);
router.post("/transaksi-lot", getTransactionLot)
router.post("/transaksi-yd", getTransactionYd)

// per asn an
router.post('/create-batch-delivery', createBatchDelivery)
router.post('/create-batch-delivery/multiplepo', createBatchDeliveryWithMultiPO)
router.post("/create-batch-delivery/makloon", createMaklonDelivery)
router.post('/create-batch-delivery/multipleso', createBatchDeliveryWithMultiSO)
router.get('/delivery', getBatchDelivery)
router.post('/delivery', getBatchDelivery)
router.get('/delivery-detail', getBatchDeliveryByBatch)
router.post('/delivery-initial', updateInitialDelivery)
router.post('/delivery-initial-maklon', updateInitialDeliveryMaklon)
router.post('/delivery-docs', getDocsByMasterDocument)
router.post('/delivery-edit-status', updateStatusDelivery)
router.post('/delivery-docs-delete', deleteDeliveryItem)
router.post('/delivery-by-md', getDeliveryByMasterDocuments);
router.post('/delivery-pdf', createPDFBatchDelivery);
router.post('/delivery-pdf-master', createPDFBatchDeliveryFromMaster);
router.post('/create-batch-delivery-secondary', createBatchDeliverySecondary);
router.get('/delivery/docs/:id', DeliveryDocsDetail);
router.get('/delivery/docs/batch/:id', DeliveryDocsBatchDetail);
router.post('/delivery/docs/batch', DeliveryDocsBatch);
router.post('/bpb-pdf', createPDFBPB);
router.post('/bpb-pdf-multi', createPDFBPBMultiV2);
router.post("/in-delivery-multipo", getDataInshipmentForMultiPO);
router.post("/card-code-sync", moveCardCodeToDelivery);
router.post("/delete-delivery", deleteDeliveryWithFollowingData)
router.post("/create-unplanned-asn", createUnplannedASN)
router.post("/create-unplanned-asn-multi-gewinn", unplannedASNwithMultiGewinn)
router.post("/delivery/connect-delivery-to-po", connectDeliveryToPo)
router.post("/delivery/connect-delivery-to-multiple-po", connectDeliveryToMultiplePo)
router.post("/delivery/connect-delivery-to-so", connectMaklonDelivery)
router.post("/delivery/connect-delivery-to-multiple-so", connectBatchDeliveryWithMultiSO)
router.post("/delivery-delete/:id", deleteDelivery)
router.post("/delivery/count-penerimaan", countPenerimaan)

router.post('/scan-qr-asn', scanQrASN);
router.post('/delivery-guards', getBatchDeliveryForGuards);
router.post('/delivery-guards-scale', getBatchDeliveryForGuards2);
router.post('/delivery-guards-history', getBatchDeliveryForGuards3);

router.post("/delivery/inbound", getInboundDelivery);
router.post("/delivery/inbound/history", historyInboundDelivery);
router.post("/delivery/inbound/:id", getDeliveryInboundByID);
router.post("/delivery/add-inbound", addInbound)
router.post("/delivery/get-surat-jalan/:id", getSuratJalan)
router.post("/delivery/create-multi-surat-jalan", createMultiSuratJalan)
router.post("/delivery/change-docnum", changeDocnum)

// test gewinn dan penerimaan pertama...
router.post('/receive-and-gewinn1', ReceiveAndGewinn1)
router.post('/gewinn2', Gewinn2)
router.post('/gewinn2Multi', multiGewinn2)
router.post('/timbang-pdf', createPDFGewinn)
router.post('/multi-timbang-pdf', createPDFGewinnMulti)
router.post('/multi-timbang-pdf-v2', createPDFGewinnMultiV2)
router.post('/get-multi-gewinn', getMultiGewinn)

// weight test
router.post('/weight-test', getWeightTest);
router.post('/weight-test/create', addWeightTestLot);
router.get('/weight-test/:id', getWeightTestDetail);
router.post("/weight-test/edit-header", editWeightTestHeader);
router.post('/weight-test/create-docs-bulk', addWeightTestDocBulk)
router.post('/weight-test/create-docs', addWeightTestDoc)
router.post('/weight-test/edit-docs', editWeightTestDoc)
router.post('/weight-test/delete-docs', deleteWeightTestDoc)
router.post("/weight-test/finalize", finalizeWeightTest)
router.get('/weight-test/delivery/:id', getWeightTestASN)
router.post('/weight-test/delivery-pdf', createPDFDetailWeightTest)

// knitting test
router.post("/knit-test/list", KnitTestGeneralList)
router.post("/knit-test", KnitTestAvailableList);
router.post("/knit-test/add", addKnitTest);

router.post("/knit-test/update", updateKnitTest);
router.post("/knit-test/approval", KnitTestListForApproval);
router.post("/knit-test/approve", ApproveMachineKnitTest);
router.post("/knit-test/for-take", KnitTestListForTake);
router.post("/knit-test/doc", AddKnitTestDocSingle);
router.post("/knit-test/doc-ycss", AddKnitTestDocYCSSSingle);
router.post("/knit-test/doc-edit", EditKnitTestDocSingle);
router.post("/knit-test/doc-delete", DeleteKnitTestDoc);
router.post("/knit-test/doc-ycss-edit", EditKnitTestDocYCSSSingle);
router.post("/knit-test/doc-ycss-delete", DeleteKnitTestYCSSDoc);
router.post("/knit-test/detail", GetKnitTestDocs);
router.post("/knit-test/retest-knitting", RetestKnitting);
router.post("/knit-test/history-knit-test", HistoryKnitTest)


router.post("/knit-test/detail/:id", KnitTestDetail);
router.post("/knit-test/finalize", FinalizeKnitTest);
router.post("/knit-test/history", KnitTestListHistory);
router.post('/knit-test/export-pdf', createPDFDetailKnitTest)


// dyeing test
router.post("/dyeing-test", GetDyeingTestReadyToShipList)
router.post("/dyeing-test/add", DeliverDyeingTest)
router.post("/dyeing-test/shipped", GetDyeingTestAlreadyShip)
router.post("/dyeing-test/receive-and-test", ReceiveDyeGreigeAndTestIt)
router.post("/dyeing-test/ready-to-finalize", DyeingTestReadyToFinalize)
router.post("/dyeing-test/finalize", FinalizeDyeingTest)
router.post("/dyeing-test/history", HistoryDyeingTest)
router.post("/dyeing-test/list", DyeingTestGeneralList)
router.post("/dyeing-test/detail/:id", DyeingTestDetail);
router.post("/dyeing-test/export-pdf", createPDFDetailDyeingTest);
router.post("/dyeing-test/retest-dyeing", RetestDyeing);
router.post("/dyeing-test/history-dyeing", DyeingTestHistory);
// dyeing test pg
router.post("/dyeing-test/get-for-pg-receive", getForPgToReceive);
router.post("/dyeing-test/get-for-pg-sent", getForPGToSent);
router.post("/dyeing-test/pg/receive", doReceiveYarnInCikampek);
router.post("/dyeing-test/pg/sent", doSentSampleToCikawung);
router.post("/dyeing-test/get-history-pg", getHistoryPG)


// grpo
router.post("/grpo", ListDeliveryForGRPO);
router.post("/grpo-maklon", ListDeliveryForGRPOMaklon);
// router.post("/grpo/data-for-sync", ListDeliveryToSync)
router.post("/grpo/proceed", ProceedGRPO);
router.post("/grpo/proceed-qrcode", ProceedQR);

// pallet
router.post("/pallet", GetPallet);
router.post("/pallet/detail", GetPalletDetail);
router.post("/pallet/history-move", GetPalletMoveHistory);
router.post("/pallet/add", AddPallet);
router.post("/pallet-ckp/add", AddPalletCKP);
router.post("/pallet/update-status", UpdatePalletStatusBulk);
router.post("/pallet/qr-code", printQrCodePallet);
router.post("/pallet/scan-qr", scanQrCodePallet);
router.post("/pallet/move", movePalletToNewLocation);

// safety stocks
// router.post("/safety-stocks/list", GetSafetyStocks);
router.post("/safety-stocks/list", GetSafetyStocksV2);
router.post("/safety-stocks/add", addSafetyDoc);
router.post("/safety-stocks/delete/:id", DeleteSafetyStock);
router.post("/safety-stocks/update", UpdateSafetyStock);

// box
router.post("/box", GetBox);
router.post("/box/add", AddBox);
router.post("/box/update", UpdateBox);
router.post("/box/delete", DeleteBox);

// Aging Box
router.post("/aging-box/list", GetAgingTable)

// item
router.post("/items/by-id-doc-batch/:id", GetItemByIDDeliveryDocBatch);
router.post("/items/qr-code", PrintQrCodeItems);
router.post("/items/scan-qr", scanQrCodeItem);
router.post("/items/list", ListItem);
router.post("/items/move/to-new-pallet", moveItemToOtherPallet);
router.post("/items/split", SplitItems);
router.post("/items/set-box", SetBoxToItem);
router.post("/items/add-sisa-produksi", AddSisaProduksi);
router.post("/items/lost-and-found", doLostAndFound);
router.post("/items/delete/", DeleteItems);
router.post("/items/item-box-detail/:id", ItemBoxDetail);
router.post("/items/adj-netto", adjNettoItemBox);
router.post("/items/resync-batch-after-consume", resyncItemBatchAfterConsume);

// per warehouse inventory an
router.get('/sync-warehouse', syncWarehouse);
router.post('/sync-warehouse2', newWarehouseMaklon);
router.post('/sync-warehouse-cikampek', syncWarehouseCikampek)
router.post('/warehouse', getWarehouse);
router.post("/warehouse/detail", getWarehouseDetail);
router.post('/warehouse-data-table', getWarehouseForDataTables);
router.post("/warehouse/qr-code", PrintQrCodeLocation);
router.post("/warehouse/scan-qr", scanQrCodeWarehouse);

// dashboard
router.get("/dashboard/inventory/count", CountInventoryWHRM);
router.get("/dashboard/item-box-status/count", CountItemBoxStatus);
router.get("/dashboard/inventory-transfer-dashboard/count", CountInventoryTransfer);
router.get("/dashboard/delivery-status-count", CountDeliveryStatus);
router.get("/dashboard/delivery-type-count", CountDeliveryType);
router.get("/dashboard/delivery-transaction", CountDeliveryTransaction);
router.get("/dashboard/yarn-dyed/count", CountSupplyYD);

// per inventory transferan
router.post('/sap-so-supply-benang', getSapSalesOrderForSupply);
router.post('/sap-so-sisa-produksi', getSapSalesOrderForSisaProduksi);
router.post("/sap-so-for-migrate", getSapSalesOrderForMigrate);

router.post("/inventory-transfer/detail", getDetailInventoryTransfer);
router.post("/inventory-transfer/lot/addlot", addLotToSupplyDoc)
router.post("/delivery/batch/for-supply", getDeliveryDocBatchForSupply);
router.post("/delivery/batch/for-supply-yd", getDeliveryDocBatchForSupplyYarnDyed);
router.post("/delivery/batch/in-supply", getDeliveryDocBatchInSupplyYarnDyed);
router.post("/inventory-transfer/list-tf-supply-batch", listInventoryTfSupplyDocsBatch)
router.post("/inventory-transfer/supply-prod/add-temp-lot", addTempSupplyLotBenang);
router.post("/inventory-transfer/yd/remove-supply-lot", RemoveSupplyLotBenangYarnDyed)
router.post("/inventory-transfer/yd/supply-lot", addSupplyLotBenangYarnDyed);
router.post("/inventory-transfer/supply-prod/get-temp-lot", getTempSupplyLotBenang);
router.post("/inventory-transfer/supply-prod/clear-temp-lot", clearTempSupplyLot);
router.post("/inventory-transfer/supply-prod/delete-temp-lot", deleteTempSupplyLot);
router.post("/inventory-transfer/supply-prod/get-temp-by-so/:id", getSupplyTempBySO);
router.post("/inventory-transfer/edit-supply-docs/:id", editSupplyDocs);
router.post("/inventory-transfer/add-item-whse", addItemWhse);
router.post("/inventory-transfer/add-item-whse-by-pallet", addItemWhseByPallet);

router.post("/items/for-supply", getItemForSupply);
router.post("/inventory-transfer/supply-prod/add-temp-item", AddTempItemSupply);
router.post("/inventory-transfer/supply-prod/get-temp-item", GetTempItemSupply);
router.post("/inventory-transfer/supply-prod/clear-temp-item", clearTempSupplyItem);
router.post("/inventory-transfer/supply-prod/delete-temp-item", deleteTempSupplyItem);

router.post("/inventory-transfer/supply-prod/do-supply", doSupplyWithSO);
router.post("/inventory-transfer/supply-prod/do-supply-whse", doSupplyWhse);
router.post("/inventory-transfer/get-supply-doc", listSupply);
router.post("/inventory-transfer/get-supply-doc/:id", listDocSupply);
router.post("/inventory-transfer/export-supply-doc", exportItemSupply);
router.post("/inventory-transfer/export-surat-jalan", exportSuratJalanWhse);
router.post("/inventory-transfer/update-nomor-kendaraan", UpdateNomerKendaraanWhse);
router.post("/inventory-transfer/add-remark-consigner", addConsignerItemSupply);
router.post("/inventory-transfer/get-supply-doc-items-by-id-doc/:id", listSupplyItemBoxBySupplyDoc);
// router.post("/inventory-transfer/get-supply-doc/export", exportListSupply);
router.post("/inventory-transfer/accept-inventory-transfer-supply", AcceptTFSupply);
router.post("/inventory-transfer/yarn-dyed-regular/cek-pallet", cekPallet)
router.post("/inventory-transfer/yarn-dyed-regular/cek-receive-yd-regular", cekReceiveYdReg)
router.post("/inventory-transfer/yarn-dyed-regular/accept-half-yd", acceptHalfYdReg)
router.post("/inventory-transfer/consume-yd-regular", consumeYdRegular)
router.post("/inventory-transfer/finalize-yd-regular", finalizeYdRegular)
router.post("/inventory-transfer/consume-missing-item", markDeliveredToShopfloorWithMissingItem)
router.post("/inventory-transfer/sasaran-mutu", countSupplySasaranMutu)

router.post("/inventory-transfer/add-supply-docs", addSupplyDocsInventoryTf)
router.post('/inventory-transfer-edit-status', updateStatusTransfer)


router.get("/dashboard/inventory-transfer/count", countSupply);
router.post("/inventory-transfer/get-temp-lot", getTemporaryDataLot);
router.post("/inventory-transfer/get-temp-item", getTemporaryDataItem);

router.post("/items/move-to-shopfloor", markForMoveToShopFloor)
router.post("/items/mark-in-shopfloor", markDeliveredToShopFloor)

router.post("/items/v2/mark-in-shopfloor", markDeliveredToShopFloorV2)
router.post("/items/v2/mark-in-shopfloor/with-pallet", markDeliveredToShopFloorV2Pallet)
router.post("/items/v2/mark-in-shopfloor/with-multi-so", markDeliveredToShopFloorV2MultiSO)

router.post("/items/mark-in-yarn-dyed", markDeliveredToYarnDyed)
router.post("/items/mark-in-yarn-dyed/with-pallet", markDeliveredToYarnDyedPallet)

router.post("/inventory-stock/add-stock", addInventoryStock)
router.post("/inventory-stock/list-inventory-stock", getInventoryStock)
router.post("/inventory-stock/resync", resyncInventoryStock)

// utils
router.post("/utils/search-item-so", cariDataSOdenganItemCode);
router.post("/clear-item-lost-from-pallet", clearPalletWhenItemLost);
router.post("/clear-delivery-planned-withnoitem", clearAllPlannedDeliveryWithNoItem);
router.post("/get-stock-item-code-lama", getStockWithItemCodeLama);
router.post("/pindah-item-code", moveItemCodeToNewItemCode);
router.post("/fix-dimensi-sisa-produksi", fixSisaProduksiDimensi);
router.post("/rename-lot", RenameLot)
router.post("/resync-wh", resyncWarehouse);
router.post("/list-irregular-location", listIrregularPallet);
router.post("/mapping-type-delivery", mappingTFSupply)
router.post("/fix-location-wh", fixlocationItemAfterConsume);
router.post("/cek-item-location", cekItem);
router.post("/cek-item-stagging", cekItemInStagging);
router.post("/fixing-opname-item", fixingOpname);
router.post("/irregular-item", irregularItemAfter);
router.post("/fix-consume-item", fixingIrregularItemAfterConsume);
router.post("/remove-consume-item", fixIrregularItemNotConsume);
router.post("/sync-suply-docs", resyncSupplyDocs)
router.post("/move-item-missing", moveMissingItemToMissingZone)
router.post("/delete-missing-item-in-supply", deleteMissingItemInSupply)
router.post('/utils/move-pallet-to-new-zone', movePalletIdletoPeralatan)
// router.post("/outstanding-box", handlerOutstandingBox)

// shop floor
router.post("/shop-floor/count", getCountShopFloor);
router.post("/shop-floor/delivery", getOnDelivery);
router.post("/shop-floor/delivered", getDelivered);

// per yarn dyed an
router.post("/sap-so-for-yarn-dyed-maklon", getSapSalesOrderForYarnDyedMaklon)
router.post("/yarn-dyed/get-rm-items", GetItemForYarnDyed);
router.post("/yarn-dyed/create-po", CreatePOYarnDyed);
// router.post("/yarn-dyed/tes-generate-po", (req, res) => { generateNumberPOYarnDyed(req, res, false) });
router.post("/yarn-dyed/po", GetPOYarnDyed);
router.post("/yarn-dyed/po/:id", GetPOYarnDyedDetail);
router.post("/yarn-dyed/export", exportPOYarnDyed);
router.post("/yarn-dyed/add-doc", AddPoDocYarnDyed);
router.post("/yarn-dyed/doc/add-rm-item", AddYarnDyedRawMaterial);
router.post("/yarn-dyed/doc/raw-material", GetYarnDyedRawMaterial);
router.post("/yarn-dyed/list-supply-rm", getYdRmV2);
router.post("/yarn-dyed/rm-for-delivery", GetYarnDyedRawMaterialForDelivery);
router.post("/yarn-dyed/shipment/create", addNewYarnDyedDelivery);
router.post("/yarn-dyed/shipment", GetYarnDyedDelivery);
router.post("/yarn-dyed/shipment/:id", GetYarnDyedDeliveryDetail);
router.post("/inventory-transfer/yd/edit-delivery", EditShipmentDetailYarnDyed)
router.post("/inventory-transfer/yd/edit-status-delivery", EditShipmentStatusYarnDyed)

router.post("/yarn-dyed/shipment/add-rm", addYarnDyedRawMaterialToShipment);
router.post("/yarn-dyed/pickup-item", pickUpYarnDyedItem);

router.post("/yarn-dyed/delete-rm", deleteYarnDyedItem);
router.post("/yarn-dyed/delete-doc", deleteYarnDyedDoc);
router.post("/yarn-dyed/delete-yd", deletePOYarnDyed);

router.post("/yarn-dyed/delivery-rm-item", getDeliveryRMItem)
router.post("/yarn-dyed/delivery-rm-item-whole", getDeliveryRMItemWhole)

router.post("/yarn-dyed/finalize-po", finalizePO);
router.post("/yarn-dyed/shipment/deliver", finalizeDelivery);

router.post("/yarn-dyed/consume-item-rm", consumeItemForYd)
router.post("/yarn-dyed/consume-item-rm/by-pallet", consumeItemForYdWithPallet)

router.post("/yarn-dyed/receive-item", receiveItemYd)
router.get("/yarn-dyed/get-last-number-ibox", getLastDataIbox)

router.post("/yarn-dyed/print-surat-jalan", printSuratJalan)

// module supply di mobile
router.post("/supply/doc/count", CountSupplyDocForWhrm);
router.post("/supply/yarn-knit/regular", getRegularYarnKnitRegularSoForMobile);
router.post("/supply/yarn-knit/maklon", getRegularYarnKnitMaklonSoForMobile);
router.post("/supply/yarn-knit/whse", getRegularYarnKnitWhseSoForMobile);
router.post("/supply/yarn-dyed", getYarnDyedForMobile);

router.post("/supply/yarn-knit/item-by-so", getYarnKnitItemBySO);
router.post("/supply/yarn-dyed/item-by-so", getYarnDyedItemBySO);

// module return grpo
router.post("/retur/yd-po", GetPOYarnDyedForReturn);
router.post("/retur/grpo/po", getSapPurchaseOrderForReturn);
router.post("/retur/maklon/so", getSapSalesOrderForReturn)
router.post("/retur/get-lot", getListLotForGRPO);
router.post("/retur/grpo/create", createReturGRPO);
router.post("/retur/list", getReturList);
router.post("/retur/detail/:id", getReturDetail);
router.post("/retur/grpo/add-lot", addLotReturGRPO);
router.post("/retur/grpo/delete", deleteReturnGRPO);
router.post("/retur/items", getItemsForRetur);
router.post("/retur/add-items-to-doc", addItemsForRetur);
router.post("/retur/items-in-retur", getItemsInRetur);
router.post("/retur/items-in-retur-by-batch", getItemsInReturByDocBatch)
router.post("/retur/delete-items", deleteItemInRetur);
router.post("/retur/delete-lot", deleteLotInRetur)
router.post("/retur/finalize", finalizeRetur);
router.post("/retur/export-pdf-retur", exportReturDetail);
router.post("/retur/export-surat-jalan", exportSuratJalan);
router.post("/retur/nomer-kendaraan/update", UpdateNomerKendaraan);
router.get("/retur/count", countAllReturForMobile);
router.post("/retur/mobile/docs", getReturDocumentForApps);
router.post("/retur/mobile/item-retur", getReturItems);
router.post("/retur/mark", markItemReturned);
// ambil barang retur
router.post("/retur/v2/mark", markDeliveredToReturnV2);
router.post("/retur/v2/mark-pallet", markDeliveredToReturnPallet);
// retur tapi ga pake item
router.post("/retur/v2/whitout-item", returnWithoutItem)

// Stock Opname
router.post("/opname/get-opname", getOpname);
router.post("/opname/item-by-pallet", getItemByPallet);
router.post("/opname/item-by-opname", getItemOpname);
router.post("/opname/do-opname", doOpname);
router.post("/opname/add-lost-item", addOpnameLostItem);
router.post("/opname/finish-opname", doFinishOpname);
router.post("/opname/export-excel", exportExcelOpname);

// stock Opname V2
router.post("/stock-opname", listStockOpname)
router.post("/stock-opname/add-opname", addStockOpname)
router.post("/stock-opname/detail/:id", detailStockOpname)
router.post("/stock-opname/complete-opname-pallet-v2", completeOpnamePalletV2)
router.post("/stock-opname/backdoor/:id", backdoorStockOpname)
router.post("/stock-opname/sasaran-mutu", cuntSasaranMutuOpname)
router.post("/stock-opname/add-single", addOpnameZone)
router.post("/stock-opname/delete-opname-doc", deleteOpname)
router.post("/stock-opname/cek", updateDataOpname)
router.post("/stock-opname/update-batch", updateBatchNetto)
// router.post("/stock-opname/backdoor-doc/:id", backdoorDocStockOpname)

// migrasi data
router.post("/migrasi/get-po", findPOForMigrasi);
router.post("/migrasi/do-migrate", doMigrasi);
router.post("/migrasi/do-migrate-maklon", doMigrasiMaklon);
router.post("/migrasi/do-migrate-yd", doMigrasiYd);

// Report
router.post("/report-persediaan-yd", ReportPersediaanYarnDyed)
router.post("/export-report-persediaan-yd", ExportPDFReportPersediaanYarnDyed)
router.post("/export-excel-report-persediaan-yd", ExportExcellReportPersediaanYarnDyed)
// router.post("/report/receive-item", ReceiveItem)
router.post("/report/export-receive-item-by-lot", ExportPDFReceiveItemByLOT)
router.post("/report/export-excel-receive-item-by-lot", ExportExcelReceiveItemByLOT)
router.post("/report/receive-item-by-po", ReportReceiveItemByPO)
router.post("/report/used-item-by-so", ReportReceiveItemBySO)
router.post("/report/penerimaan-yarn", PenerimaanYarn);
router.post("/report/penerimaan-yarn-maklon", PenerimaanYarnMaklon);
router.post("/report/status-stock-po", StatusStockAndPO);
router.post("/report/status-stock-so", StatusStockAndSO);
router.post("/report/status-stock-yd", StatusStockYd);
router.post("/report/outstanding-po", outstandingPO)
router.post("/report/report-regular-supply", YarnSupplyByDate);
router.post("/report/quality-check", getQualityReport)
router.post("/report/space-util", getSpaceUtilizationReport);
router.post("/report/list-lot", findLotFromItem);
// router.post("/report/moving-avg", reportsMovingAveragePoPriceV2);
router.post("/report/moving-avg", reportsMovingAveragePriceV3);

// serial port
router.post("/serial-port", getSerialPortData);

export default router;