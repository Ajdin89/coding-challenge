import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({ orderBy: { startUtc: 'asc' } });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto) {
    const start = new Date(dto.startUtc);
    const end = new Date(dto.endUtc);

    await this.checkConflict(start, end);

    return this.prisma.event.create({
      data: {
        title: dto.title,
        startUtc: start,
        endUtc: end,
        timezone: dto.timezone,
      },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.findOne(id);

    const start = dto.startUtc ? new Date(dto.startUtc) : existing.startUtc;
    const end = dto.endUtc ? new Date(dto.endUtc) : existing.endUtc;

    await this.checkConflict(start, end, id);

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        startUtc: start,
        endUtc: end,
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }

  private async checkConflict(start: Date, end: Date, excludeId?: string) {
    const conflict = await this.prisma.event.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startUtc: { lt: end },
        endUtc: { gt: start },
      },
    });

    if (conflict) {
      throw new ConflictException({
        message: 'Time slot conflicts with an existing event',
        conflictingEvent: conflict,
      });
    }
  }
}
