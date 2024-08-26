import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";

export interface User {
  user_id: string;
  ws: WebSocket;
}

export class UserManager {
  private static instance: UserManager;
  private queue: string[];
  private users: User[];
  private roomManager: RoomManager;

  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }

  broadcast(ws: WebSocket) {
    ws.send(
      JSON.stringify({
        users: this.users.map((ele) => ele.user_id),
        queue: this.queue,
      }),
    );
  }

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  addUser(user_id: string, ws: WebSocket) {
    this.users.push({
      user_id,
      ws,
    });
    this.queue.push(user_id);
    ws.send(JSON.stringify({ type: "lobby" }));
    this.connectUser(ws);
    this.initHandlers(ws);
  }

  removeUser(ws: WebSocket) {
    const deletingUser = this.users.filter((user) => user.ws === ws);
    this.users = this.users.filter((user) => user.ws !== ws);
    this.queue = this.queue.filter(
      (user_id) => user_id !== deletingUser[0].user_id,
    );
  }

  connectUser(ws: WebSocket) {
    if (this.queue.length < 2) {
      console.log("There aren't enough users to connect");
      return;
    }
    const u1 = this.queue.shift();
    const u2 = this.queue.shift();

    const user1 = this.users.find((user) => user.user_id === u1);
    const user2 = this.users.find((user) => user.user_id === u2);

    if (!user1 || !user2) return;

    this.roomManager.createRoom(user1, user2);
    this.connectUser(ws);
  }
  initHandlers(ws: WebSocket) {
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "createOffer":
          this.roomManager.onOffer(message.roomId, message.offer, ws);
          break;

        case "createAnswer":
          this.roomManager.onAnswer(message.roomId, message.answer, ws);
          break;

        case "iceCandidate":
          this.roomManager.onIceCandidates(
            message.roomId,
            ws,
            message.candidate,
            message.person,
          );
          break;
      }
    });
  }
}
