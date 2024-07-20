import { Router } from 'express';
import { addEvent, deleteEvent, detailEvent, editEvent, listEvent } from '../Controllers/Events';
import { getListUser } from '../Controllers/Users';

const router = Router();

// event
router.post("/event/list", listEvent);
router.post("/event/add", addEvent);
router.post("/event/delete/:id", deleteEvent);
router.post("/event/detail/:id", detailEvent);
router.post("/event/edit", editEvent);

// user
router.post("/users/list", getListUser)

export default router;