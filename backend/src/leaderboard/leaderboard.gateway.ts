import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeaderboardService } from './leaderboard.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/leaderboard',
})
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LeaderboardGateway.name);

  constructor(
    private leaderboardService: LeaderboardService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('getLeaderboard')
  async handleGetLeaderboard(client: Socket, payload: { limit?: number }) {
    const leaderboard = await this.leaderboardService.getLeaderboard(payload.limit);
    return { event: 'leaderboard', data: leaderboard };
  }

  @SubscribeMessage('getCandidateRank')
  async handleGetCandidateRank(client: Socket, payload: { candidateId: string }) {
    const rank = await this.leaderboardService.getCandidateRank(payload.candidateId);
    return { event: 'candidateRank', data: rank };
  }

  // Broadcast leaderboard update to all connected clients
  async broadcastLeaderboardUpdate() {
    const leaderboard = await this.leaderboardService.getLeaderboard(20);
    this.server.emit('leaderboardUpdate', leaderboard);
    this.logger.log('Broadcasted leaderboard update to all clients');
  }
}
