import { Router } from 'express';
import { StartMonthlyStock, startSyncSAPQueue } from '../Controllers/SAPSyncController';
import { OriGenerateQRCode } from '../Controllers/Util';
// import { reportsMovingAveragePoPrice } from '../Controllers/Report/pricing';
// import { getWeightTest } from '../Controllers/WeightTest';
// import { SyncBusinessPartner, SyncGoodsReceipt, SyncGoodsReceiptDocs, SyncMasterItem, SyncPurchaseOrder, SyncPurchaseOrderDocs, SyncPurchaseRequest, SyncPurchaseRequestDocs } from '../Controllers/SAPSyncController';
// import { getAdvanceShipmentSapData } from '../Controllers/SAPGetController';

const router = Router();
// gatau buat apa public routess....
// router.get('/shipment-po-data', getAdvanceShipmentSapData)

// router.get('/sync-pr', SyncPurchaseRequest)
// router.get('/sync-pr-docs', SyncPurchaseRequestDocs)
// router.get('/sync-master-item', SyncMasterItem)
// router.get('/sync-business-partner', SyncBusinessPartner)
// router.get('/sync-po', SyncPurchaseOrder)
// router.get('/sync-po-docs', SyncPurchaseOrderDocs)
// router.get('/sync-grpo', SyncGoodsReceipt)
// router.get('/sync-grpo-docs', SyncGoodsReceiptDocs)

// router.post("weight-test", getWeightTest);

router.post('/sync-sap', startSyncSAPQueue);
router.post('/monthly-stock', StartMonthlyStock);
router.get("/qr-code-gen/:data", OriGenerateQRCode)
// pricing 
// please ignore this
// router.post("/avg-pricing", reportsMovingAveragePoPrice)
export default router;