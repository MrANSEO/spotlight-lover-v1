import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const s = await this.prisma.systemSetting.findUnique({ where: { key } });
    return s?.value ?? null;
  }

  async set(key: string, value: string) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    this.logger.log(`Setting mis à jour : ${key} = ${value}`);
    return { key: result.key, value: result.value };
  }

  async getAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
      select: { key: true, value: true, updatedAt: true },
    });
  }

  async getMaintenanceStatus() {
    const [mode, msg] = await Promise.all([
      this.prisma.systemSetting.findUnique({
        where: { key: 'maintenanceMode' },
      }),
      this.prisma.systemSetting.findUnique({
        where: { key: 'maintenanceMessage' },
      }),
    ]);
    return { maintenance: mode?.value === 'true', message: msg?.value ?? null };
  }

  async setMaintenanceMode(enabled: boolean, message?: string) {
    await Promise.all([
      this.prisma.systemSetting.upsert({
        where: { key: 'maintenanceMode' },
        create: { key: 'maintenanceMode', value: String(enabled) },
        update: { value: String(enabled) },
      }),
      message !== undefined
        ? this.prisma.systemSetting.upsert({
            where: { key: 'maintenanceMessage' },
            create: { key: 'maintenanceMessage', value: message },
            update: { value: message },
          })
        : Promise.resolve(),
    ]);
    this.logger.log(
      `Mode maintenance ${enabled ? 'ACTIVÉ 🔴' : 'DÉSACTIVÉ 🟢'}`,
    );
    return this.getMaintenanceStatus();
  }
}
