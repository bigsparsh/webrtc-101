import { WebSocketServer } from "ws";
import { UserManager } from "./managers/UserManager";

const wss = new WebSocketServer({ port: 8080 });
const userManager = UserManager.getInstance();

wss.on("connection", (ws) => {
  ws.send("You are connected to the signaling server!");
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "connect":
        userManager.addUser(message.user_id, ws);
        break;
      case "waiting-for-connection":
        userManager.connectUser(ws);
        break;
      case "broadcast":
        userManager.broadcast(ws);
        break;
    }
  });
  ws.on("close", () => {
    userManager.removeUser(ws);
  });
});
