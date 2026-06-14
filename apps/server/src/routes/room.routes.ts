import { Router } from "express";
import { RoomController } from "../controllers/room.controller";

const router: Router = Router();

router.post("/create-room", RoomController.createRoom);

export default router;
