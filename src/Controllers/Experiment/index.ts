import { Request, Response } from 'express';
import { defaultErrorHandling } from '../../Utils/errorHandling';

export const getExperiment = async (req: Request, res: Response) => {
    try {
        const { id } = req.body

        const groupByItemCode = await req.prisma.ppic_item_box.groupBy({
            by: ['ItemCode'],
            where: {
                ppic_inventory_transfer_yarn_dyed_doc_item_rm: {
                    some: {
                        ppic_delivery_docs: {
                            ppic_delivery: {
                                id
                            }
                        }
                    }
                }
            },
            _sum: {
                netto_in_kg: true,
                bruto_in_kg: true,
            }
        })

        return res.status(200).json({
            groupByItemCode
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}