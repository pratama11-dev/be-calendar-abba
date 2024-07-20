import { Router } from 'express';
import { addEvent, deleteEvent, detailEvent, listEvent } from '../Controllers/Events';
import { getListUser } from '../Controllers/Users';

const router = Router();

// event
router.post("/event/list", listEvent);
router.post("/event/add", addEvent);
router.post("/event/delete/:id", deleteEvent);
router.post("/event/detail/:id", detailEvent);

// user
router.post("/users/list", getListUser)

export default router;