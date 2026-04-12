import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RecurrenceDto, RecurrenceFrequency } from './dto/recurrence.dto';

const MAX_OCCURRENCES = 500;

interface Occurrence {
  start: Date;
  end: Date;
}

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

    if (end <= start) {
      throw new BadRequestException('End must be after start');
    }

    if (!dto.recurrence) {
      await this.checkConflict(start, end);
      return this.prisma.event.create({
        data: {
          title: dto.title,
          startUtc: start,
          endUtc: end,
          timezone: dto.timezone,
          color: dto.color ?? null,
        },
      });
    }

    const occurrences = expandRecurrence(start, end, dto.recurrence);

    if (occurrences.length === 0) {
      throw new BadRequestException('Recurrence produced no occurrences');
    }

    const seriesId = randomUUID();

    for (const occ of occurrences) {
      await this.checkConflict(occ.start, occ.end);
    }

    await this.prisma.event.createMany({
      data: occurrences.map((occ) => ({
        title: dto.title,
        startUtc: occ.start,
        endUtc: occ.end,
        timezone: dto.timezone,
        color: dto.color ?? null,
        seriesId,
      })),
    });

    const first = await this.prisma.event.findFirst({
      where: { seriesId },
      orderBy: { startUtc: 'asc' },
    });
    return first!;
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.findOne(id);
    const hasColor = Object.prototype.hasOwnProperty.call(dto, 'color');

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
        ...(hasColor && { color: dto.color ?? null }),
      },
    });
  }

  async remove(id: string, scope: 'single' | 'series' = 'single') {
    const existing = await this.findOne(id);

    if (scope === 'series' && existing.seriesId) {
      await this.prisma.event.deleteMany({
        where: { seriesId: existing.seriesId },
      });
      return;
    }

    await this.prisma.event.delete({ where: { id } });
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

/**
 * Expand a recurrence rule into concrete UTC occurrences.
 * Math is done on UTC timestamps — fine for the common case of a user in a
 * single timezone. DST boundaries may shift local time of day by an hour.
 */
function expandRecurrence(
  startUtc: Date,
  endUtc: Date,
  rec: RecurrenceDto,
): Occurrence[] {
  const duration = endUtc.getTime() - startUtc.getTime();
  const until = new Date(rec.until);
  until.setUTCHours(23, 59, 59, 999);

  const occurrences: Occurrence[] = [];
  const push = (start: Date) => {
    occurrences.push({ start, end: new Date(start.getTime() + duration) });
  };

  if (rec.frequency === RecurrenceFrequency.DAILY) {
    let cursor = new Date(startUtc);
    while (cursor <= until && occurrences.length < MAX_OCCURRENCES) {
      push(new Date(cursor));
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() + rec.interval);
    }
  } else if (rec.frequency === RecurrenceFrequency.WEEKLY) {
    const days = (
      rec.daysOfWeek && rec.daysOfWeek.length > 0
        ? [...rec.daysOfWeek]
        : [startUtc.getUTCDay()]
    ).sort((a, b) => a - b);

    // Anchor week = the Sunday of the start date's week (UTC).
    const weekAnchor = new Date(startUtc);
    weekAnchor.setUTCDate(weekAnchor.getUTCDate() - weekAnchor.getUTCDay());
    weekAnchor.setUTCHours(
      startUtc.getUTCHours(),
      startUtc.getUTCMinutes(),
      startUtc.getUTCSeconds(),
      startUtc.getUTCMilliseconds(),
    );

    outer: while (occurrences.length < MAX_OCCURRENCES) {
      for (const dow of days) {
        const occ = new Date(weekAnchor);
        occ.setUTCDate(occ.getUTCDate() + dow);
        if (occ < startUtc) continue;
        if (occ > until) break outer;
        push(new Date(occ));
        if (occurrences.length >= MAX_OCCURRENCES) break outer;
      }
      weekAnchor.setUTCDate(weekAnchor.getUTCDate() + 7 * rec.interval);
      if (weekAnchor > until) break;
    }
  } else if (rec.frequency === RecurrenceFrequency.MONTHLY) {
    let cursor = new Date(startUtc);
    while (cursor <= until && occurrences.length < MAX_OCCURRENCES) {
      push(new Date(cursor));
      cursor = new Date(cursor);
      cursor.setUTCMonth(cursor.getUTCMonth() + rec.interval);
    }
  } else if (rec.frequency === RecurrenceFrequency.YEARLY) {
    let cursor = new Date(startUtc);
    while (cursor <= until && occurrences.length < MAX_OCCURRENCES) {
      push(new Date(cursor));
      cursor = new Date(cursor);
      cursor.setUTCFullYear(cursor.getUTCFullYear() + rec.interval);
    }
  }

  return occurrences;
}
