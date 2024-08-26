import type { User } from "./UserManager";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

export interface Room {
  user1: User;
  user2: User;
}
export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(user1: User, user2: User) {
    const roomId = uuidv4();
    this.rooms.set(roomId, { user1, user2 });

    user1.ws.send(JSON.stringify({ type: "send-offer", roomId }));
    user2.ws.send(JSON.stringify({ type: "send-offer", roomId }));
  }

  onOffer(roomId: string, offer: string, ws: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser = room.user1.ws === ws ? room.user2 : room.user1;
    receivingUser?.ws.send(
      JSON.stringify({ type: "createOffer", offer, roomId }),
    );
  }

  onAnswer(roomId: string, answer: string, ws: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser = room.user1.ws === ws ? room.user2 : room.user1;

    receivingUser?.ws.send(
      JSON.stringify({ type: "createAnswer", answer, roomId }),
    );
  }

  onIceCandidates(
    roomId: string,
    ws: WebSocket,
    candidate: any,
    person: "sender" | "receiver",
  ) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser = room.user1.ws === ws ? room.user2 : room.user1;
    receivingUser.ws.send(
      JSON.stringify({ type: "iceCandidate", candidate, person, roomId }),
    );
  }
}
