import { Request, Response } from "express";
import { defaultErrorHandling } from "../../Utils/errorHandling";

export const getListUser = async (req: Request, res: Response) => {
    try {
        const data = await req.prisma.user.findMany({})

        return res.status(200).json({
            data: data
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}