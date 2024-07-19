import { Request, Response } from "express";
import { defaultErrorHandling } from "../../Utils/errorHandling";
import moment from "moment";
import { createDirectoryWhrm } from "../../Utils/fsUtil"
import { PrismaClient } from '@prisma/client';
import { SAPQueue } from "../../Utils/queue";
import { z } from "zod";
import { Queue } from "bullmq";
import { DateUtil } from "../../Utils/dateUtils";
import { manSyncFuncSalesOrder } from "../../bull/manual-sync";
import { ZodSchema } from "../../zSchema";
import { resyncBatchAfterConsume } from "../WHRM/Item";
import { poolPromise } from "../../mssql/pool";
import { Int } from "mssql";
import { generateDigitCheck, zeroPad } from "../../Utils/stringUtil";
import QRCode from 'qrcode';

async function generateAbbreviation(name: string, prisma: PrismaClient) {
    // Sanitize the name first
    const sanitized = name.replace(/[^a-zA-Z0-9\s]/g, '');

    let abbreviation: string;

    if (sanitized.length <= 3) {
        abbreviation = sanitized;
    } else {
        const words = sanitized.split(' ').map(word => word[0]);

        abbreviation = words.slice(0, 3).join('');
    }

    while (abbreviation.length < 3) {
        abbreviation += getRandomAlphanumeric();
    }

    // Ensure uniqueness in the database
    let exists = await prisma.ppic_sap_business_partner_propose_cardfname.findUnique({
        where: {
            CardFName: abbreviation
        }
    });

    while (exists) {
        // Adjust the last character with a random alphanumeric for uniqueness
        abbreviation = abbreviation.substring(0, 2) + getRandomAlphanumeric();

        // Re-check the abbreviation's existence in the database
        exists = await prisma.ppic_sap_business_partner_propose_cardfname.findUnique({
            where: {
                CardFName: abbreviation
            }
        });
    }

    return abbreviation;
}

function getRandomAlphanumeric() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return chars.charAt(Math.floor(Math.random() * chars.length));
}

export const doFormatCardCode = async (req: Request, res: Response) => {
    try {
        const allData = await req.prisma.ppic_sap_business_partner.findMany({
            select: {
                CardCode: true,
                CardName: true,
                CardFName: true,
            }
        });

        for (const data of allData) {
            const abbreviation = await req.prisma.ppic_sap_business_partner_propose_cardfname.findUnique({
                where: {
                    CardCode: data.CardCode
                }
            })
            await req.prisma.ppic_sap_business_partner.update({
                where: {
                    CardCode: data.CardCode
                },
                data: {
                    CardFName: abbreviation.CardFName
                }
            })
            // if(data.CardFName && data.CardFName.length > 3) {
            //     // console.log(data.CardFName);
            //     const abbreviation = await generateAbbreviation(data.CardName, req.prisma);
            //     await req.prisma.ppic_sap_business_partner_propose_cardfname.upsert({
            //         where: {
            //             CardCode: data.CardCode
            //         },
            //         create: {
            //             CardCode: data.CardCode,
            //             CardFName: abbreviation,
            //             CardName: data.CardName,
            //         },
            //         update: {
            //             CardCode: data.CardCode,
            //             CardFName: abbreviation,
            //             CardName: data.CardName,
            //         }
            //     });
            // } 
            // else {
            //     // Ensure uniqueness in the database
            //     let exists = await req.prisma.ppic_sap_business_partner_propose_cardfname.findUnique({
            //         where: {
            //             CardFName: data.CardFName
            //         }
            //     });
            //     if(exists) {
            //         const abbreviation = await generateAbbreviation(data.CardName, req.prisma);
            //         await req.prisma.ppic_sap_business_partner_propose_cardfname.upsert({
            //             where: {
            //                 CardCode: data.CardCode
            //             },
            //             create: {
            //                 CardCode: data.CardCode,
            //                 CardFName: abbreviation,
            //                 CardName: data.CardName,
            //             },
            //             update: {
            //                 CardCode: data.CardCode,
            //                 CardFName: abbreviation,
            //                 CardName: data.CardName,
            //             }
            //         });
            //     } else {
            //         await req.prisma.ppic_sap_business_partner_propose_cardfname.upsert({
            //             where: {
            //                 CardCode: data.CardCode
            //             },
            //             create: {
            //                 CardCode: data.CardCode,
            //                 CardFName: data.CardFName,
            //                 CardName: data.CardName,
            //             },
            //             update: {
            //                 CardCode: data.CardCode,
            //                 CardFName: data.CardFName,
            //                 CardName: data.CardName,
            //             }
            //         });
            //     }
            // }
        }

        return res.status(200).json({
            data: allData
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const pindahinOrphanItem = async (req: Request, res: Response) => {
    try {
        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });
        const data = await req.prisma.ppic_item_box.updateMany({
            where: {
                id_warehouse: null
            },
            data: {
                id_warehouse: getStaging.id
            }
        })

        return res.status(200).json({ data })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const pindahinOrphanPallet = async (req: Request, res: Response) => {
    try {
        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });
        const data = await req.prisma.ppic_pallet.updateMany({
            where: {
                id_warehouse: null
            },
            data: {
                id_warehouse: getStaging.id
            }
        })

        return res.status(200).json({ data })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const tesExcel = async (req: Request, res: Response) => {
    try {
        const day = moment().format("DD")
        const month = moment().format("MM")
        const year = moment().format("YYYY")
        const path = await createDirectoryWhrm(day, month, year);
        const filename = 'testing2.xlsx';
        const pathExcel = `/pdf/whrm/${year}/${month}/${day}/${filename}`
        // createExcel({
        //     data: [
        //         ["Name", "Age", "Address"],
        //         ["John", 25, "123 Fake St"],
        //         ["Doe", 30, "456 Real Ave"]
        //     ],
        //     filename: filename,
        //     pathSave: path,
        //     sheetName: "tes"
        // })

        return res.status(200).json({
            data: pathExcel
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const checkRolesASN = async (req: Request, res: Response, roleTocheck: string) => {
    try {
        const roles = await req.prisma.sso_roles.findMany({
            where: {
                sso_user_roles_platform_pivot: {
                    some: {
                        id_user: req.user.id,
                        sso_platforms: {
                            // asn
                            client_id: "BsXhhD8YGUdH"
                        }
                    }
                }
            }
        });

        const rolesString = roles.map((d) => d.roles_name);
        if (rolesString.includes(roleTocheck)) {
            return true
        }
        return false
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const deleteDeliveryWithFollowingData = async (req: Request, res: Response) => {
    try {
        const { id_delivery } = req.body
        const roleCheck = await checkRolesASN(req, res, "Super Admin")
        if (!roleCheck) throw new Error("you cant do this!");
        const data = await req.prisma.ppic_delivery.findFirstOrThrow({
            where: {
                id: id_delivery
            },
            include: {
                ppic_delivery_print_history: true,
                ppic_delivery_inbound_photo: true,
                ppic_test_result_gwinn: true,
                ppic_master_document: {
                    include: {
                        ppic_master_document_docs: true
                    }
                },
                ppic_multiple_po_delivery: {
                    include: {
                        ppic_master_document: {
                            include: {
                                ppic_master_document_docs: true
                            }
                        }
                    }
                },
                ppic_delivery_docs: {
                    include: {
                        ppic_delivery_docs_batch: true
                    }
                }
            }
        });

        for (const delivery_doc of data.ppic_delivery_docs) {
            for (const batch of delivery_doc.ppic_delivery_docs_batch) {
                const id_batch = batch.id

                await req.prisma.ppic_inventory_transfer_supply_docs_items_box.deleteMany({
                    where: {
                        id_delivery_batch: id_batch
                    }
                });

                await req.prisma.ppic_inventory_transfer_yarn_dyed_doc_item_rm.deleteMany({
                    where: {
                        ppic_item_box: {
                            id_delivery_docs_batch: id_batch
                        }
                    }
                });

                await req.prisma.ppic_inventory_transfer_yarn_dyed_doc_item_yd.deleteMany({
                    where: {
                        ppic_item_box: {
                            id_delivery_docs_batch: id_batch
                        }
                    }
                });

                await req.prisma.ppic_inventory_transfer_supply_docs_batch.deleteMany({
                    where: {
                        id_delivery_batch: id_batch
                    }
                });

                await req.prisma.ppic_return_document_items.deleteMany({
                    where: {
                        ppic_item_box: {
                            id_delivery_docs_batch: id_batch
                        }
                    }
                });

                await req.prisma.ppic_opname_item.deleteMany({
                    where: {
                        ppic_item_box: {
                            id_delivery_docs_batch: id_batch
                        }
                    }
                });

                await req.prisma.ppic_test_result_dyeing.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                })

                await req.prisma.ppic_test_result_dyeing_history.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                })

                await req.prisma.ppic_test_result_knit.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                });

                await req.prisma.ppic_test_result_knit_history.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                });

                await req.prisma.ppic_test_result_weight.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                });

                await req.prisma.ppic_temp_lot_supply_benang.deleteMany({
                    where: {
                        id_delivery_batch: id_batch
                    }
                })

                const grpobatch = await req.prisma.ppic_goods_receipt_po_secondary_docs_batch.findFirst({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                })
                if (grpobatch?.id) {
                    await req.prisma.ppic_goods_receipt_po_secondary_docs_batch.delete({
                        where: {
                            id_delivery_docs_batch: id_batch
                        }
                    })
                }


                await req.prisma.ppic_return_document_doc_batch.deleteMany({
                    where: {
                        id_lot: id_batch
                    }
                })

                await req.prisma.ppic_item_box.deleteMany({
                    where: {
                        id_delivery_docs_batch: id_batch
                    }
                })

                await req.prisma.ppic_delivery_docs_batch.delete({
                    where: {
                        id: id_batch
                    }
                })
            }

            await req.prisma.ppic_goods_receipt_po_secondary_docs.deleteMany({
                where: {
                    id_delivery_docs: delivery_doc.id
                }
            });

            await req.prisma.ppic_inventory_transfer_yarn_dyed_doc_item_rm.deleteMany({
                where: {
                    id_delivery_docs: delivery_doc.id
                }
            })

            await req.prisma.ppic_delivery_docs.delete({
                where: {
                    id: delivery_doc.id
                }
            })
        }

        if (data.ppic_delivery_print_history.length > 0) {
            await req.prisma.ppic_delivery_print_history.deleteMany({
                where: {
                    id_delivery: data.id
                }
            })
        }

        if (data.ppic_delivery_inbound_photo.length > 0) {
            await req.prisma.ppic_delivery_inbound_photo.deleteMany({
                where: {
                    id_delivery: data.id
                }
            })
        }

        if (data.ppic_test_result_gwinn) {
            await req.prisma.ppic_test_result_gewinn.delete({
                where: {
                    id_delivery: data.id
                }
            })
        }

        if (data.ppic_multiple_po_delivery.length > 0) {
            await req.prisma.ppic_multiple_po_delivery.deleteMany({
                where: {
                    id_delivery: id_delivery
                }
            })
        }

        await req.prisma.ppic_delivery.delete({
            where: {
                id: id_delivery
            }
        })

        return res.status(200).json({
            data
        })
    } catch (error) {
        console.log(error)
        return defaultErrorHandling(res, error)
    }
}

export const manualSyncPurchaseOrder = async (req: Request, res: Response) => {
    try {
        const { docnum, search } = req.body;
        if (!docnum && !search) throw new Error("docnum or search must be filled!");
        const queue = SAPQueue["manual sync po"];
        queue.add(`manual sync po ${moment().format("DD MM YY HH mm ss")}`, {
            docnum: docnum,
            search: search
        })

        return res.status(200).json({
            info: "PO dan PO Docs berhasil ditambahkan ke antrian!"
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const manualSyncSalesOrder = async (req: Request, res: Response) => {
    try {
        const { docnum, search } = req.body
        const queue = SAPQueue["manual sync so"];
        queue.add(`manual sync so ${moment().format("DD MM YY HH mm ss")}`, {
            docnum: docnum,
            search: search
        })

        return res.status(200).json({
            info: "SO, SoDoc, PDO, dan PDO Doc Berhasil ditambahkan ke antrian"
        })
    } catch (error) {
        console.log(error)
        return defaultErrorHandling(res, error)
    }
}

export const GetJobs = async (req: Request, res: Response) => {
    try {
        const { queue_man } = req.body
        const queueType = Object.entries(SAPQueue).map((d) => d[0])
        if (queueType.includes(queue_man)) {
            const queue: Queue = SAPQueue[queue_man];
            const jobs = await queue.getJobs();
            const active = await queue.getActive();
            return res.status(200).json({
                active,
                jobs
            })
        }
        throw new Error("queue not found!");
    } catch (error) {
        console.log(error)
        return defaultErrorHandling(res, error)
    }
}

export const getJobLogs = async (req: Request, res: Response) => {
    try {
        const { queue_man, id } = req.body
        const queueType = Object.entries(SAPQueue).map((d) => d[0])
        if (queueType.includes(queue_man)) {
            const queue: Queue = SAPQueue[queue_man];
            const logs = await queue.getJobLogs(id);
            const job = await queue.getJob(id)
            const progress = job.progress
            return res.status(200).json({
                progress,
                job,
                logs
            })
        }
        throw new Error("queue not found!");
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const clearPalletWhenItemLost = async (req: Request, res: Response) => {
    try {
        const { id_pallet } = req.body;
        if (!id_pallet) throw new Error("id_pallet must be filled");

        const data = await req.prisma.ppic_pallet.findFirstOrThrow({
            where: {
                id: id_pallet,
            },
            include: {
                ppic_whrm_loc_warehouse: true,
                ppic_item_box: true
            }
        });

        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });

        for await (const item of data.ppic_item_box) {
            await req.prisma.ppic_item_box.update({
                where: {
                    id: item.id
                },
                data: {
                    id_pallet: null,
                    id_warehouse: getStaging.id,
                    last_updated_by: req.user.id,
                    updated_at: DateUtil.CurDate(),
                    missing_type: 99,
                    missing_reason: "For Supply With No System because cant do it yet on 5 oct 2023",
                    ppic_item_box_move_history: {
                        create: {
                            is_lost: 1,
                            id_from_location: item.id_warehouse,
                            id_from_pallet: item.id_pallet,
                            id_to_location: getStaging.id,
                            id_to_pallet: null
                        }
                    }
                }
            });
        }

        return res.status(200).json({
            data: {
                updatedCount: data.ppic_item_box.length
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const clearAllPlannedDeliveryWithNoItem = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.ppic_delivery.findMany({
            where: {
                NOT: {
                    ppic_delivery_docs: {}
                },
                id_delivery_status: {
                    in: [1, 1003]
                }
            }
        });

        for (const delivery of data) {
            try {
                await req.prisma.ppic_delivery.delete({
                    where: {
                        id: delivery.id
                    }
                })
            } catch (error) {
                console.log(error)
            }
        }

        return res.status(200).json({
            count: data.length,
            data
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const getStockWithItemCodeLama = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.$queryRaw`
            SELECT
                stock.*,
                ss.safety_stock_danger_in_kg,
                ss.safety_stock_warning_in_kg 
            FROM
                (
                SELECT
                    penerimaan.ItemCode,
                    penerimaan.ItemName,
                    SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_in_kg_active,
                    SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed,
                    SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_lost,
                    SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_retur,
                    SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_consumed_yd,
                    SUM ( CASE WHEN ibox.is_sisa_produksi IN ( 1 ) THEN ibox.netto_in_kg ELSE 0 END ) AS total_netto_sisa_produksi,
                    SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN ibox.cones ELSE 0 END ) AS total_cones_active,
                    SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed,
                    SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN ibox.cones ELSE 0 END ) AS total_cones_lost,
                    SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN ibox.cones ELSE 0 END ) AS total_cones_retur,
                    SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN ibox.cones ELSE 0 END ) AS total_cones_consumed_yd,
                    SUM ( CASE WHEN ibox.is_sisa_produksi IN ( 1 ) THEN ibox.cones ELSE 0 END ) AS total_cones_sisa_produksi,
                    SUM ( CASE WHEN ibox.id_status IN ( 1, 2 ) THEN 1 ELSE 0 END ) AS total_case_active,
                    SUM ( CASE WHEN ibox.id_status IN ( 3 ) THEN 1 ELSE 0 END ) AS total_case_consumed,
                    SUM ( CASE WHEN ibox.id_status IN ( 4 ) THEN 1 ELSE 0 END ) AS total_case_lost,
                    SUM ( CASE WHEN ibox.id_status IN ( 5 ) THEN 1 ELSE 0 END ) AS total_case_retur,
                    SUM ( CASE WHEN ibox.id_status IN ( 6 ) THEN 1 ELSE 0 END ) AS total_case_consumed_yd,
                    SUM ( CASE WHEN ibox.is_sisa_produksi IN ( 1 ) THEN 1 ELSE 0 END ) AS total_case_sisa_produksi 
                FROM
                    (
                    SELECT
                        mi.ItemCode,
                        mi.ItemName 
                    FROM
                        ppic.ppic_delivery d
                        JOIN ppic.ppic_master_document md ON d.id_master_document = md.id
                        JOIN ppic.ppic_master_document_docs mddoc ON md.id = mddoc.id_master_document
                        JOIN ppic.ppic_sap_purchase_order po ON po.DocEntry = md.sap_doc_entry_po
                        JOIN ppic.ppic_delivery_docs pdd ON pdd.id_delivery = d.id 
                        AND mddoc.id = pdd.id_master_document
                        JOIN ppic.ppic_delivery_docs_batch pdb ON pdb.id_delivery_docs = pdd.id 
                        AND pdb.status_timbang= 4
                        JOIN ppic.ppic_sap_master_item mi ON mi.ItemCode = pdd.ItemCode
                        JOIN ppic.ppic_test_result_weight wt ON wt.id_delivery_docs_batch = pdb.id 
                    ) AS penerimaan
                    JOIN ppic.ppic_item_box ibox ON ibox.ItemCode= penerimaan.ItemCode 
                    AND ibox.ItemCode IN (
                        '10005030',
                        '10005080',
                        '10005130',
                        '10005150',
                        '10005200',
                        '10005220',
                        '10008080',
                        '10006130',
                        '10006180',
                        '10006240',
                        '10006350',
                        '10111220',
                        '10111300',
                        '10006080',
                        '10006150',
                        '10008220',
                        '10006220',
                        '10006230',
                        '10006300' 
                    ) 
                GROUP BY
                    penerimaan.ItemCode,
                    penerimaan.ItemName 
                ) AS stock
                LEFT JOIN ppic.ppic_safety_stock ss ON ss.ItemCode= stock.ItemCode 
            ORDER BY
                ItemName
        `;

        return res.status(200).json({
            data
        })
    } catch (error) {

    }
}

export const moveItemCodeToNewItemCode = async (req: Request, res: Response) => {
    try {
        // const dataItemCodeBlackList = [
        //     '10005030',
        //     '10005080',
        //     '10005130',
        //     '10005150',
        //     '10005200',
        //     '10005220',
        //     '10008080',
        //     '10006130',
        //     '10006180',
        //     '10006240',
        //     '10006350',
        //     '10111220',
        //     '10111300',
        //     '10006080',
        //     '10006150',
        //     '10008220',
        //     '10006220',
        //     '10006230',
        //     '10006300'
        // ];
        const { item_code_old, item_code_new } = req.body;
        // const item_code_old_name = await req.prisma.ppic_sap_master_item.findFirstOrThrow({ where: { ItemCode: item_code_old } });
        // const item_code_new_name = await req.prisma.ppic_sap_master_item.findFirstOrThrow({ where: { ItemCode: item_code_new } });
        // if (!dataItemCodeBlackList.includes(item_code_old)) throw new Error("item code old tidak ditemukan di data blacklist");
        // if (item_code_old_name.ItemName !== item_code_new_name.ItemName) throw new Error(`nama itemcode tidak sama, ${item_code_old_name.ItemName} !== ${item_code_new_name.ItemName}`);

        const delivery_doc = await req.prisma.ppic_delivery_docs.updateMany({
            where: {
                ItemCode: item_code_old
            },
            data: {
                ItemCode: item_code_new,
            }
        });

        const item_box = await req.prisma.ppic_item_box.updateMany({
            where: {
                ItemCode: item_code_old
            },
            data: {
                ItemCode: item_code_new
            }
        });

        return res.status(200).json({
            data: {
                delivery_doc,
                item_box
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const manSyncSOHttp = async (req: Request, res: Response) => {
    try {
        const data = await manSyncFuncSalesOrder({
            prisma: req.prisma,
            docnum: req.body.docnum,
            skip_progress: true,
            search: undefined
        });

        return res.status(200).json({
            data
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const fixSisaProduksiDimensi = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.ppic_item_box.findMany({
            where: {
                id_status: {
                    in: [1, 2]
                },
                is_sisa_produksi: 1
            }
        });

        for await (const itembox of data) {
            if (itembox.height === null || itembox.width === null || itembox.length === null) {
                const box = await req.prisma.ppic_item_box.findFirst({
                    where: {
                        id: itembox.id
                    },
                    include: {
                        ppic_box: true
                    }
                })
                if (box.ppic_box) {
                    await req.prisma.ppic_item_box.update({
                        where: {
                            id: itembox.id,
                        },
                        data: {
                            length: box.ppic_box.length,
                            width: box.ppic_box.width,
                            height: box.ppic_box.height
                        }
                    })
                }
            }
        }

        return res.status(200).json({
            data
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const RenameLot = async (req: Request, res: Response) => {
    try {
        const { id_lot, lot_name } = req.body
        const before = await req.prisma.ppic_delivery_docs_batch.findFirstOrThrow({
            where: {
                id: id_lot
            }
        })
        const data = await req.prisma.ppic_delivery_docs_batch.update({
            where: {
                id: id_lot
            },
            data: {
                lot: lot_name,
                updated_at: DateUtil.CurDate(),
                last_updated_by: req.user.id,
                ppic_item_box: {
                    updateMany: {
                        where: {
                            id_delivery_docs_batch: id_lot
                        },
                        data: {
                            batch_lot: lot_name,
                            updated_at: DateUtil.CurDate(),
                            last_updated_by: req.user.id
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            info: `lot renamed from ${before.lot} to ${lot_name}`,
            data
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const listIrregularPallet = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.ppic_item_box.findMany({
            take: req.body?.limit ?? 10,
            skip: req.body?.offset ?? 0,
            where: {
                id_status: {
                    in: [
                        1, 2
                    ]
                },
                ppic_pallet: {
                    ppic_whrm_loc_warehouse: {},
                    id_warehouse: {
                        notIn: [1464]
                    }
                },
                id_warehouse: 1464
            },
            include: {
                ppic_pallet: true,
                ppic_whrm_loc_warehouse: true,
                ppic_sap_business_partner: {
                    select: {
                        CardName: true,
                    },
                },
                ppic_status_items: true,
                ppic_sap_master_item: {
                    select: {
                        ItemName: true,
                    },
                },
                ppic_box: {
                    include: {
                        ppic_sap_business_partner: {
                            select: {
                                CardName: true,
                            },
                        },
                    }
                },
                ppic_delivery_docs_batch: {
                    select: {
                        ppic_delivery_docs: {
                            select: {
                                ppic_delivery: {
                                    select: {
                                        id_type_delivery: true
                                    }
                                }
                            }
                        }
                    }
                },
            }
        })

        const count = await req.prisma.ppic_item_box.count({
            where: {
                id_status: {
                    in: [
                        1, 2
                    ]
                },
                ppic_pallet: {
                    ppic_whrm_loc_warehouse: {},
                    id_warehouse: {
                        notIn: [1464]
                    }
                },
                id_warehouse: 1464
            }
        })

        return res.status(200).json({
            data, count
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const resyncWarehouse = async (req: Request, res: Response) => {
    try {
        const itembox = await req.prisma.ppic_item_box.findMany({
            where: {
                id_status: {
                    in: [
                        1, 2
                    ]
                },
                ppic_pallet: {
                    ppic_whrm_loc_warehouse: {},
                    id_warehouse: {
                        notIn: [1464]
                    }
                },
                id_warehouse: 1464
            },
            include: {
                ppic_pallet: true,
            }
        });

        for await (const ibox of itembox) {
            await req.prisma.ppic_item_box.update({
                where: {
                    id: ibox.id
                },
                data: {
                    id_warehouse: ibox.ppic_pallet.id_warehouse
                }
            })
        }

        return res.status(200).json({
            count: itembox.length,
            data: itembox
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const mappingTFSupply = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.ppic_inventory_transfer_supply.findMany({})

        for await (const item of data) {
            const updateData = await req.prisma.ppic_inventory_transfer_supply.update({
                where: {
                    id: item.id
                },
                data: {
                    id_type_supply: item?.is_maklon == 1 ? 2 : 1
                }
            })
        }


        return res.status(200).json({
            data
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}


export const fixlocationItemAfterConsume = async (req: Request, res: Response) => {
    try {
        const itembox = await req.prisma.ppic_item_box.findMany({
            where: {
                id_status: {
                    in: [
                        3
                    ]
                },
                id_pallet: {
                    not: null
                },
                id_warehouse: {
                    notIn: [1526]
                }
            },
            include: {
                ppic_pallet: true,
            }
        });

        for await (const ibox of itembox) {
            await req.prisma.ppic_item_box.update({
                where: {
                    id: ibox.id
                },
                data: {
                    id_warehouse: 1526,
                    id_pallet: null,
                    last_updated_by: req?.user?.id
                }
            })

            await req.prisma.ppic_history_item_box.update({
                where: {
                    id: ibox.id
                },
                data: {
                    id_warehouse: 1526,
                    id_pallet: null,
                    last_updated_by: req?.user?.id
                }
            })
        }

        return res.status(200).json({
            count: itembox.length,
            data: itembox
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const cekItem = async (req: Request, res: Response) => {
    try {
        const itembox = await req.prisma.ppic_item_box.findMany({
            where: {
                id_status: {
                    in: [
                        3
                    ]
                },
                id_pallet: {
                    not: null
                },
                id_warehouse: {
                    notIn: [1526]
                }
            },
            include: {
                ppic_pallet: true,
            }
        });

        return res.status(200).json({
            count: itembox.length,
            data: itembox
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const cekItemInStagging = async (req: Request, res: Response) => {
    try {
        const dataBatch = await req.prisma.ppic_delivery_docs_batch.findMany({
            where: {
                status_grpo: 0,
                ppic_delivery_docs: {
                    ppic_delivery: {
                        id_type_delivery: 10
                    }
                }
            },
            include: {
                ppic_test_result_weight: true
            }
        })

        let totalItemCount = 0;
        for (const batch of dataBatch) {
            if (batch.ppic_test_result_weight && batch.ppic_test_result_weight.qty_case !== null && batch.ppic_test_result_weight.qty_case !== undefined) {
                totalItemCount += batch.ppic_test_result_weight.qty_case.toNumber();
            }
        }


        return res.status(200).json({
            data: totalItemCount
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const fixingOpname = async (req: Request, res: Response) => {
    try {

        const dataItem = await req.prisma.ppic_item_box.updateMany({
            where: {
                id_pallet: 287,
                id_status: 2
            },
            data: {
                id_status: 1,
            }
        })

        const findItem = await req.prisma.ppic_item_box.findMany({
            where: {
                id_pallet: 287
            }
        })

        for (const data of findItem) {
            const updateHistory = await req.prisma.ppic_history_item_box.createMany({
                data: {
                    id_item_box: data?.id,
                    qr_code: data?.qr_code,
                    digit_check: data?.digit_check,
                    batch_lot: data?.batch_lot,
                    po_number_remark: data?.po_number_remark,
                    pr_number_remark: data?.pr_number_remark,
                    cones: data?.cones,
                    netto_in_kg: data?.netto_in_kg,
                    bruto_in_kg: data?.bruto_in_kg,
                    grpo_date: data?.grpo_date,
                    created_at: DateUtil.CurDate(),
                    updated_at: DateUtil.CurDate(),
                    last_updated_by: req.user.id,
                    height: data?.height,
                    length: data?.length,
                    width: data?.width,
                    ItemCode: data?.ItemCode,
                    id_status: 1,
                }
            })
        }

        return res.status(200).json({
            // count: dataItem.length,
            data: dataItem
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const irregularItemAfter = async (req: Request, res: Response) => {
    try {
        const { limit, offset } = req.body

        const data = await req.prisma.ppic_item_box.findMany({
            take: limit ? parseInt(limit as string) : 10,
            skip: offset ? parseInt(offset as string) : 0,
            where: {
                id_status: {
                    in: [3]
                },
                id_pallet: {
                    not: null
                }
            },
            include: {
                ppic_status_items: true,
                ppic_sap_business_partner: {
                    select: {
                        CardCode: true,
                        CardName: true,
                    }
                },
                ppic_pallet: true,
                ppic_whrm_loc_warehouse: true,
                ppic_sap_master_item: {
                    select: {
                        ItemCode: true,
                        ItemName: true
                    }
                },
                ppic_delivery_docs_batch: {
                    include: {
                        ppic_delivery_docs: {
                            include: {
                                ppic_delivery: true
                            }
                        }
                    }
                },
                ppic_inventory_transfer_supply_docs_items_box: {
                    include: {
                        ppic_inventory_transfer_supply_docs_batch: {
                            include: {
                                ppic_inventory_transfer_supply_docs: {
                                    include: {
                                        ppic_inventory_transfer_supply: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const count = await req.prisma.ppic_item_box.count({
            where: {
                id_status: {
                    in: [3]
                },
                id_pallet: {
                    not: null
                }
            }
        })

        return res.status(200).json({
            data, count
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const fixingIrregularItemAfterConsume = async (req: Request, res: Response) => {
    try {
        const input = ZodSchema.ZFixIrregularItem.parse(req.body);

        const getPersiapanProduksi = await req.prisma.ppic_warehouse.findFirst({
            where: {
                qr_code: "PP-REG.19",
            },
        });

        const dataUpdate = await req.prisma.ppic_item_box.update({
            where: {
                id: input?.id_item_box
            },
            data: {
                id_pallet: null,
                id_warehouse: getPersiapanProduksi?.id
            }
        })

        return res.status(200).json({
            dataUpdate
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const fixIrregularItemNotConsume = async (req: Request, res: Response) => {
    try {
        const input = ZodSchema.ZFixIrregularItem.parse(req.body);

        // find inv tf supp doc item box
        const findInvTfItem = await req?.prisma?.ppic_inventory_transfer_supply_docs_items_box.findFirstOrThrow({
            where: {
                id_item_box: input?.id_item_box
            }
        })

        const data_batch = await req.prisma.ppic_inventory_transfer_supply_docs_batch.findFirstOrThrow({
            where: {
                id: findInvTfItem.id_its_doc_batch,
            },
        });
        // console.log(data_batch)
        const delivdocsbatch = await req.prisma.ppic_delivery_docs_batch.findFirstOrThrow({
            where: {
                id: data_batch.id_delivery_batch,
            },
            include: {
                ppic_delivery_docs: {
                    select: {
                        ItemCode: true,
                        ppic_delivery_item: {
                            select: {
                                ItemName: true,
                            },
                        },
                        ppic_delivery: {
                            select: {
                                id_type_delivery: true,
                            },
                        },
                    },
                },
            },
        });

        // remove item rm supply
        const removeItem = await req?.prisma?.ppic_inventory_transfer_supply_docs_items_box.delete({
            where: {
                id: findInvTfItem?.id
            }
        })

        // update si docs
        const counter = await req.prisma.ppic_item_box.aggregate({
            where: {
                ppic_inventory_transfer_supply_docs_items_box: {
                    some: {
                        ppic_inventory_transfer_supply_docs: {
                            id: findInvTfItem?.id_trf_supply_docs
                        }
                    }
                }
            },
            _sum: {
                netto_in_kg: true,
                cones: true
            }
        })
        const updateSupply = await req.prisma.ppic_inventory_transfer_supply_docs.update({
            where: {
                id: findInvTfItem?.id_trf_supply_docs,
            },
            data: {
                supplied_cones: counter._sum.cones.toNumber(),
                supplied_netto_in_kg: counter._sum.netto_in_kg.toNumber(),
                updated_at: DateUtil.CurDate(),
                last_updated_by: req.user.id,
            },
        });

        // update item to create
        const findItem = await req.prisma.ppic_item_box.update({
            where: {
                id: input?.id_item_box,
            },
            data: {
                id_status: 1,
                updated_at: DateUtil?.CurDate(),
                last_updated_by: req?.user?.id,
            }
        })

        // resync item
        await resyncBatchAfterConsume(req, delivdocsbatch.id);

        return res.status(200).json({
            findInvTfItem, updateSupply, findItem
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const resyncSupplyDocs = async (req: Request, res: Response) => {
    try {
        const input = ZodSchema.ZResyncSOToSupply.parse(req.body);
        const pool = await poolPromise;
        const data_sap = await pool.request().input('id_so', Int, input.id_so).query(`
            SELECT
                so.DocNum,
                pdo_docs.ItemCode,
                pdo_docs.ItemName,
                pdo_docs.U_MIS_feeder,
                pdo_docs.U_MIS_composition,
                SUM ( pdo_docs.plannedqty ) as planned_qty 
            FROM
                ORDR so
                JOIN OWOR pdo ON so.docnum= pdo.OriginNum
                JOIN WOR1 pdo_docs ON pdo_docs.DocEntry= pdo.DocEntry 
            WHERE
                so.DocNum=@id_so 
                AND (pdo_docs.ItemCode LIKE '11%' or pdo_docs.ItemCode LIKE '10%' or pdo_docs.ItemCode LIKE '40%')
            GROUP BY
                so.DocNum,
                pdo_docs.ItemCode,
                pdo_docs.ItemName,
                pdo_docs.U_MIS_feeder,
                pdo_docs.U_MIS_composition
        `)
        const data_from_sap: {
            DocNum: number,
            ItemCode: string,
            ItemName: string,
            U_MIS_feeder: number,
            U_MIS_composition: number,
            planned_qty: number
        }[] = data_sap?.recordset;

        const dts = await req.prisma.ppic_inventory_transfer_supply.findFirstOrThrow({
            where: {
                id_so: input.id_so
            }
        })

        for await (const ds of data_from_sap) {
            // todo remove it first
            await req.prisma.ppic_inventory_transfer_supply_docs.create({
                data: {
                    id_trf_supply: dts.id,
                    item_code: ds.ItemCode,
                    feeder: ds.U_MIS_feeder.toString(),
                    composition: ds.U_MIS_composition.toString(),
                    required_netto_in_kg: ds.planned_qty
                }
            })
        }
        return res.status(200).json({
            data: data_from_sap
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const handlerOutstandingBox = async (req: Request, res: Response) => {
    try {
        const { lot } = req.body

        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });

        const dataBatch = await req.prisma.ppic_delivery_docs_batch.findFirstOrThrow({
            where: {
                lot: lot
            },
            include: {
                ppic_test_result_weight: true,
                ppic_item_box: {
                    where: {
                        is_sisa_produksi: 0
                    }
                },
                ppic_delivery_docs: {
                    include: {
                        ppic_delivery: {
                            select: {
                                id_type_delivery: true,
                                ppic_master_document: {
                                    select: {
                                        ppic_sap_purchase_order: {
                                            select: {
                                                DocNum: true,
                                            }
                                        },
                                        sap_pr_ref: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const count = parseInt(dataBatch?.ppic_test_result_weight?.qty_case?.toString() ?? "") - parseInt(dataBatch?.ppic_item_box?.length.toString() ?? "")

        let owner = 0
        if (dataBatch?.ppic_delivery_docs.ppic_delivery.id_type_delivery === 10) owner = 1
        if (dataBatch?.ppic_delivery_docs.ppic_delivery.id_type_delivery === 12) owner = 2
        if (dataBatch?.ppic_delivery_docs.ppic_delivery.id_type_delivery === 15) owner = 3
        const tahun = moment().format("YY");
        const bulan = moment().format("MM");
        const tanggal = moment().format("DD");
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();
        const runningNumberFromDB = await req.prisma.ppic_running_number_item_box.findFirst({
            where: {
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        let runningNumber = runningNumberFromDB?.last_running_number ?? 1
        const qrItems = [];
        const objectInserts = [];
        for (let i = 0; i < count; i++) {
            const qr_code = `${owner}-${tahun}${bulan}${tanggal}-${zeroPad(runningNumber, 4)}`
            qrItems.push(qr_code);
            const checkdigit = generateDigitCheck();
            const objectInsert = {
                id_warehouse: getStaging?.id ?? null,
                qr_code: qr_code,
                digit_check: checkdigit,
                batch_lot: dataBatch.lot,
                po_number_remark: dataBatch?.ppic_delivery_docs?.ppic_delivery?.ppic_master_document?.ppic_sap_purchase_order?.DocNum?.toString(),
                pr_number_remark: dataBatch?.ppic_delivery_docs?.ppic_delivery?.ppic_master_document?.sap_pr_ref,
                is_maklon: dataBatch?.ppic_delivery_docs.ppic_delivery.id_type_delivery === 12 ? 1 : 0,
                cones: dataBatch?.ppic_test_result_weight?.jumlah_cones,
                netto_in_kg: dataBatch.ppic_test_result_weight?.average_netto,
                bruto_in_kg: dataBatch.ppic_test_result_weight?.average_bruto,
                // grpo_date: DateUtil.CurDate(),
                created_at: DateUtil.CurDate(),
                updated_at: DateUtil.CurDate(),
                last_updated_by: req.user.id,
                // height: box.height,
                // length: box.length,
                // width: box.width,
                id_delivery_docs_batch: dataBatch.id,
                card_code: dataBatch?.ppic_delivery_docs.card_code,
                ItemCode: dataBatch?.ppic_delivery_docs.ItemCode,
                id_status: 4,
                is_yarn_dyed: owner === 3 ? 1 : 0,
                missing_type: 99,
                missing_reason: "For Supply With No System because cant do it yet on 5 oct 2023",
            }
            objectInserts.push(objectInsert);

            runningNumber += 1
        }

        let saveLastRunningNumber = {}

        if (runningNumberFromDB?.id) {
            saveLastRunningNumber = await req.prisma.ppic_running_number_item_box.update({
                where: {
                    id: runningNumberFromDB?.id
                },
                data: {
                    last_running_number: runningNumber,
                    last_updated_by: req.user.id,
                    updated_at: DateUtil.CurDate()
                }
            })
        } else {
            saveLastRunningNumber = await req.prisma.ppic_running_number_item_box.create({
                data: {
                    created_at: moment().toDate(),
                    last_running_number: runningNumber,
                    last_updated_by: req.user.id,
                    updated_at: DateUtil.CurDate()
                }
            })
        }

        const data = await req.prisma.ppic_item_box.createMany({
            data: objectInserts
        })

        await resyncBatchAfterConsume(req, dataBatch.id)

        return res.status(200).json({
            data: dataBatch
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const moveMissingItemToMissingZone = async (req: Request, res: Response) => {
    try {
        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });

        const getMissingZone = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "MZ"
            }
        });

        const getData = await req.prisma.ppic_item_box.findMany({
            where: {
                id_warehouse: getStaging?.id,
                id_status: 4,
                missing_type: 99,
                id_pallet: null,
                // id_box: null,
            }
        })

        const count = await req.prisma.ppic_item_box.count({
            where: {
                id_warehouse: getStaging?.id,
                id_status: 4,
                missing_type: 99,
                id_pallet: null,
                // id_box: null,
            }
        })


        for (const iterator of getData) {
            await req.prisma.ppic_item_box.update({
                where: {
                    id: iterator?.id
                },
                data: {
                    id_warehouse: getMissingZone.id,
                    ppic_item_box_move_history: {
                        create: {
                            id_from_pallet: iterator.id_pallet,
                            id_to_pallet: iterator.id_pallet,
                            id_from_location: iterator.id_warehouse,
                            id_to_location: getMissingZone.id,
                            created_at: DateUtil.CurDate(),
                            id_user: req.user.id,
                            is_following_pallet: 1,
                        }
                    }
                }
            })
        }

        return res.status(200).json({
            data: {
                getData,
                count
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const deleteMissingItemInSupply = async (req: Request, res: Response) => {
    try {
        const getStaging = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "ST"
            }
        });

        const getMissingZone = await req.prisma.ppic_warehouse.findFirst({
            where: {
                warehouse_location: "MZ"
            }
        });

        const getData = await req.prisma.ppic_item_box.findMany({
            where: {
                id_warehouse: getStaging?.id,
                id_status: 4,
                missing_type: 99,
                id_pallet: null,
                ppic_opname_item: {
                    some: {

                    }
                }
            }
        })

        const count = await req.prisma.ppic_item_box.count({
            where: {
                id_warehouse: getStaging?.id,
                id_status: 4,
                missing_type: 99,
                id_pallet: null,
            }
        })


        return res.status(200).json({
            data: {
                getData,
                count
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const getItemLostInOpnameToFound = async (req: Request, res: Response) => {
    try {
        const { id_opname } = req.body

        const getItem = await req.prisma.ppic_opname.findFirstOrThrow({
            where: {
                id: id_opname
            },
            include: {
                ppic_opname_item: {
                    include: {
                        ppic_item_box: true
                    }
                },
                _count: {
                    select: {
                        ppic_opname_item: true
                    }
                }
            }
        })

        const findPallet = await req.prisma.ppic_pallet.findFirstOrThrow({
            where: {
                id: getItem?.id_pallet
            }
        })

        let loopData = []
        for (const iterator of getItem?.ppic_opname_item) {
            const data = await req.prisma.ppic_item_box.update({
                where: {
                    id: iterator?.id_item_box
                },
                data: {
                    id_status: 1,
                    updated_at: DateUtil.CurDate(),
                    id_pallet: findPallet?.id,
                    id_warehouse: findPallet?.id_warehouse,
                    last_updated_by: req.user.id,
                    ppic_item_box_move_history: {
                        create: {
                            is_lost: 2,
                            created_at: DateUtil.CurDate(),
                            id_user: req.user.id
                        }
                    }
                }
            });
            await resyncBatchAfterConsume(req, data.id_delivery_docs_batch)
            loopData.push(data)
        }

        return res.status(200).json({
            data: {
                loopData,
                // count
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const movePalletIdletoPeralatan = async (req: Request, res: Response) => {
    try {
        const findNewZone = await req.prisma.ppic_warehouse.findFirstOrThrow({
            where: {
                qr_code: "PR.01"
            }
        })

        const findPallet = await req.prisma.ppic_pallet.findMany({
            where: {
                ppic_item_box: {
                    none: {}
                },
                id_warehouse: {
                    not: findNewZone?.id
                }
            },
            include: {
                ppic_item_box: true
            }
        })

        for (const iterator of findPallet) {
            await req.prisma.ppic_pallet.update({
                where: {
                    id: iterator?.id
                },
                data: {
                    id_warehouse: findNewZone?.id,
                    ppic_pallet_move_history: {
                        create: {
                            id_user: req.user.id,
                            id_from_location: iterator?.id_warehouse,
                            id_to_location: findNewZone?.id,
                            created_at: DateUtil.CurDate(),
                        }
                    }
                }
            })
        }

        const count = await req.prisma.ppic_pallet.count({
            where: {
                ppic_item_box: {
                    none: {}
                },
                id_warehouse: {
                    not: findNewZone?.id
                }
            }
        })



        return res.status(200).json({
            data: {
                findPallet,
                count
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const insetIdDeliveryBatchInOpname = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const findOpname = await req.prisma.ppic_stock_opname.findFirstOrThrow({
            where: {
                id: parseInt(id)
            },
            include: {
                ppic_stock_opname_docs: true
            }
        })

        for (const loopData of findOpname?.ppic_stock_opname_docs) {
            // find data
            const dataBatch = await req.prisma.ppic_stock_opname_batch.findMany({
                where: {
                    id_batch_lot: {
                        equals: null
                    },
                    id_stock_opname_doc: loopData?.id
                }
            })

            for (const iterator of dataBatch) {

                const findBatchDev = await req.prisma.ppic_delivery_docs_batch.findMany({
                    where: {
                        lot: iterator?.batch_lot
                    }
                })

                if (findBatchDev?.length <= 1) {
                    await req.prisma.ppic_stock_opname_batch.update({
                        where: {
                            id: iterator?.id
                        },
                        data: {
                            id_batch_lot: findBatchDev?.[0]?.id
                        }
                    })
                }
            }
        }



        return res.status(200).json({
            data: {
                findOpname
            }
        })
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}

export const OriGenerateQRCode = async (req: Request, res: Response) => {
    try {
        const data = req.params.data;
        const qrCodeDataUri = await QRCode.toBuffer(data, {
            margin: 1,
            width: 500
        });

        // Set content type to image/png
        res.set('Content-Type', 'image/png');

        // Send the QR Code image as response
        return res.send(qrCodeDataUri);
    } catch (error) {
        return defaultErrorHandling(res, error)
    }
}