import { Socket } from 'socket.io';

export type Connection = {
  socketId: string;
  userId: string;
};

class WebSockets {
  public connections: Connection[] = [];

  connection(socket: Socket) {
    socket.on('disconnect', () => {
      this.connections = this.connections.filter((connection) => connection.socketId !== socket.id);
    });
    socket.on('identity', (userId) => {
      this.connections.push({
        socketId: socket.id,
        userId: userId,
      });
    });
    socket.on('subscribe', (room, otherUserId: string = '') => {
      this.subscribeOtherUser(room, otherUserId);
      socket.join(room);
    });
    socket.on('unsubscribe', (room) => {
      socket.leave(room);
    });
  }

  subscribeOtherUser(room, otherUserId: string) {
    const sockets = this.connections.filter((connection) => connection.userId === otherUserId);
    sockets.map((connection) => {
      const socketConn = global.io.sockets.connected(connection.socketId);
      if (socketConn) {
        socketConn.join(room);
      }
    });
  }
}

export default new WebSockets();
