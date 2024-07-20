import { Request, Response } from 'express';
import { defaultErrorHandling } from '../../Utils/errorHandling';
import { ZodSchema } from '../../zSchema';
import { DateUtil } from '../../Utils/dateUtils';
import { z } from 'zod';

export const listEvent = async (req: Request, res: Response) => {
    try {
        const { users, search } = z
            .object({
                users: z.array(
                    z.string()
                ).nullable().optional(),
                search: z.string().nullable().optional(),
            })
            .parse(req.body);

        const data = await req.prisma.event.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            users?.length ? {
                                user_event: {
                                    some: {
                                        user: {
                                            name: {
                                                in: users
                                            }
                                        }
                                    }
                                }
                            } : undefined,
                            search ? {
                                title: {
                                    contains: search
                                }
                            } : undefined
                        ]
                    }
                ]
            },
            include: {
                user_event: {
                    include: {
                        event: true,
                        user: true
                    }
                }
            }
        })

        for (const iterator of data) {
            // @ts-ignore
            iterator?.start = iterator?.start_event
            // @ts-ignore
            iterator?.end = iterator?.end_event
        }

        return res.status(200).json({
            data: data
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}

export const addEvent = async (req: Request, res: Response) => {
    try {
        const input = ZodSchema.ZAddDataCalendar.parse(req.body);

        // check, already event on it or not?
        const overlappingEvent = await req.prisma.event.findFirst({
            where: {
                OR: [
                    {
                        start_event: {
                            lte: input.date_end,
                        },
                        end_event: {
                            gte: input.date_start,
                        }
                    },
                    {
                        start_event: {
                            lte: input.date_start,
                        },
                        end_event: {
                            gte: input.date_start,
                        }
                    },
                    {
                        start_event: {
                            lte: input.date_end,
                        },
                        end_event: {
                            gte: input.date_end,
                        }
                    }
                ]
            }
        });

        if (overlappingEvent) {
            throw new Error("Already Event on it");
        }

        const event = await req.prisma.event.create({
            data: {
                title: input?.title,
                start_event: input?.date_start,
                end_event: input?.date_end
            }
        })

        if (input?.user && input.user.length > 0) {
            for (const userName of input.user) {
                // Check if the user already exists
                let user = await req.prisma.user.findFirst({
                    where: { name: userName }
                });

                // If the user does not exist, create the user
                if (!user) {
                    user = await req.prisma.user.create({
                        data: {
                            name: userName,
                            created_at: DateUtil?.CurDate()
                        }
                    });
                }

                // Link the user to the event
                await req.prisma.user_event.create({
                    data: {
                        user_id: user.id,
                        event_id: event.id
                    }
                });
            }
        }

        return res.status(200).json({
            data: { event }
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}

export const editEvent = async (req: Request, res: Response) => {
    try {
        const input = ZodSchema.ZEditDataCalendar.parse(req.body);
        
        const event = await req.prisma.event.update({
            where: {
                id: input?.id
            },
            data: {
                title: input?.title,
                start_event: input?.date_start,
                end_event: input?.date_end
            }
        })

        return res.status(200).json({
            data: { event }
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}

export const detailEvent = async (req: Request, res: Response) => {
    try {
        const { id } = z
            .object({
                id: z.string()
            })
            .parse(req.params);

        const data = await req.prisma.event.findFirstOrThrow({
            where: {
                id: parseInt(id)
            },
            include: {
                user_event: {
                    include: {
                        event: true,
                        user: true
                    }
                }
            }
        })

        // @ts-ignore
        data?.start = data?.start_event
        // @ts-ignore
        data?.end = data?.end_event

        return res.status(200).json({
            data: data
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = z
            .object({
                id: z.string()
            })
            .parse(req.params);

        const data = await req.prisma.event.delete({
            where: {
                id: parseInt(id)
            }
        })

        return res.status(200).json({
            data: data
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}

export const updateEvent = async (req: Request, res: Response) => {
    try {

        return res.status(200).json({
            // data: data
        })
    } catch (error) {
        return defaultErrorHandling(res, error);
    }
}