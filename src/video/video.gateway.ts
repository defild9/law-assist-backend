// src/video.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userNames = new Map<string, string>();
  private userRooms = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const room = this.userRooms.get(client.id);

    this.userNames.delete(client.id);
    this.userRooms.delete(client.id);

    if (room) {
      client.to(room).emit('userLeft', { id: client.id });
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() payload: { room: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room, name } = payload;

    this.userNames.set(client.id, name);
    this.userRooms.set(client.id, room);

    client.join(room);

    const sockets = await this.server.in(room).fetchSockets();
    const existing = sockets
      .filter((s) => s.id !== client.id)
      .map((s) => ({
        id: s.id,
        name: this.userNames.get(s.id)!,
      }));

    client.emit('allUsers', existing);

    client.to(room).emit('userJoined', { id: client.id, name });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { to: string; sdp: any; fromName: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('offer', {
      from: client.id,
      fromName: data.fromName,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { to: string; sdp: any; fromName: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('answer', {
      from: client.id,
      fromName: data.fromName,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIce(
    @MessageBody() data: { to: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('ice-candidate', {
      from: client.id,
      candidate: data.candidate,
    });
  }
}
