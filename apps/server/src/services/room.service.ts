import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

export class RoomService {
  public static createRoom(): { roomId: string; shareUrl: string } {
    const roomId = uuidv4();
    const shareUrl = `${config.corsOrigin}/receive/${roomId}`;
    return { roomId, shareUrl };
  }
}
