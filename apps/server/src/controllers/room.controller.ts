import { Request, Response, NextFunction } from "express";
import { RoomService } from "../services/room.service";

export class RoomController {
  public static createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId, shareUrl } = RoomService.createRoom();
      res.status(201).json({ roomId, shareUrl });
    } catch (error) {
      next(error);
    }
  }
}
