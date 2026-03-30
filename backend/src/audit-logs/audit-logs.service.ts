// ═══════════════════════════════════════════════════════════════════════════════
// audit-logs.service.ts — SpotLightLover
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    action?: string;
    resource?: string;
    userId?: string;
  }) {
    const { page, limit, action, resource, userId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Adapter la structure pour le frontend (qui attend entity/entityId/metadata)
    const data = logs.map((log) => ({
      id: log.id,
      action: log.action,
      // Le frontend AuditLogsPage attend ces champs :
      entity: log.resource, // resource → entity
      entityId:
        (log.details as any)?.targetId ||
        (log.details as any)?.candidateId ||
        '',
      metadata: log.details, // details → metadata
      userId: log.userId,
      user: log.user,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true } },
      },
    });

    if (!log) throw new NotFoundException('Log introuvable.');

    return {
      ...log,
      entity: log.resource,
      metadata: log.details,
    };
  }
}
