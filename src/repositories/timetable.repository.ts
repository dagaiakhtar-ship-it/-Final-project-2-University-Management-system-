import { prisma } from '../services/db.service';
import { Prisma, Timetable } from '@prisma/client';

export type TimetableWithDetails = Prisma.TimetableGetPayload<{
  include: {
    courseOffering: {
      include: {
        department: true;
        program: true;
        semester: true;
        section: true;
        subject: true;
        teacher: {
          include: {
            user: true;
          };
        };
      };
    };
    teacher: {
      include: {
        user: true;
      };
    };
    subject: true;
    section: true;
    room: {
      include: {
        building: true;
      };
    };
    timeSlot: true;
  };
}>;

export class TimetableRepository {
  async findAll(params: {
    search?: string;
    teacherId?: number;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    roomId?: number;
    buildingId?: number;
    subjectId?: number;
    academicYear?: string;
    status?: string;
    dayOfWeek?: string;
    timeSlotId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<TimetableWithDetails[]> {
    const {
      search,
      teacherId,
      departmentId,
      programId,
      semesterId,
      sectionId,
      roomId,
      buildingId,
      subjectId,
      academicYear,
      status,
      dayOfWeek,
      timeSlotId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip,
      take,
    } = params;

    const where: Prisma.TimetableWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    // Filters that reside on related models:
    if (dayOfWeek) {
      where.timeSlot = {
        dayOfWeek,
      };
    }

    if (buildingId) {
      where.room = {
        buildingId,
      };
    }

    if (departmentId || programId || semesterId) {
      where.courseOffering = {
        ...(departmentId && { departmentId }),
        ...(programId && { programId }),
        ...(semesterId && { semesterId }),
      };
    }

    if (search) {
      where.OR = [
        { academicYear: { contains: search, mode: 'insensitive' } },
        { session: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { subject: { code: { contains: search, mode: 'insensitive' } } },
        { section: { name: { contains: search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
        { room: { building: { name: { contains: search, mode: 'insensitive' } } } },
        { teacher: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { teacher: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const allowedSortFields = ['id', 'uuid', 'academicYear', 'session', 'weeklyRepeat', 'effectiveFrom', 'effectiveTo', 'status', 'createdAt', 'updatedAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    let orderBy: Prisma.TimetableOrderByWithRelationInput = {
      [validatedSortBy]: sortOrder,
    };

    // Special sort logic for relations if needed
    if (sortBy === 'dayOfWeek' || sortBy === 'periodNumber') {
      orderBy = {
        timeSlot: {
          [sortBy === 'dayOfWeek' ? 'dayOfWeek' : 'periodNumber']: sortOrder,
        },
      };
    }

    return prisma.timetable.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        subject: true,
        section: true,
        room: {
          include: {
            building: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async count(params: {
    search?: string;
    teacherId?: number;
    departmentId?: number;
    programId?: number;
    semesterId?: number;
    sectionId?: number;
    roomId?: number;
    buildingId?: number;
    subjectId?: number;
    academicYear?: string;
    status?: string;
    dayOfWeek?: string;
    timeSlotId?: number;
  }): Promise<number> {
    const {
      search,
      teacherId,
      departmentId,
      programId,
      semesterId,
      sectionId,
      roomId,
      buildingId,
      subjectId,
      academicYear,
      status,
      dayOfWeek,
      timeSlotId,
    } = params;

    const where: Prisma.TimetableWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (dayOfWeek) {
      where.timeSlot = {
        dayOfWeek,
      };
    }

    if (buildingId) {
      where.room = {
        buildingId,
      };
    }

    if (departmentId || programId || semesterId) {
      where.courseOffering = {
        ...(departmentId && { departmentId }),
        ...(programId && { programId }),
        ...(semesterId && { semesterId }),
      };
    }

    if (search) {
      where.OR = [
        { academicYear: { contains: search, mode: 'insensitive' } },
        { session: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { subject: { code: { contains: search, mode: 'insensitive' } } },
        { section: { name: { contains: search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
        { room: { building: { name: { contains: search, mode: 'insensitive' } } } },
        { teacher: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { teacher: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return prisma.timetable.count({ where });
  }

  async findById(id: number): Promise<TimetableWithDetails | null> {
    return prisma.timetable.findFirst({
      where: { id, deletedAt: null },
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        subject: true,
        section: true,
        room: {
          include: {
            building: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async findByUuid(uuid: string): Promise<TimetableWithDetails | null> {
    return prisma.timetable.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        subject: true,
        section: true,
        room: {
          include: {
            building: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async create(data: Prisma.TimetableUncheckedCreateInput): Promise<TimetableWithDetails> {
    return prisma.timetable.create({
      data,
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        subject: true,
        section: true,
        room: {
          include: {
            building: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async update(id: number, data: Prisma.TimetableUncheckedUpdateInput): Promise<TimetableWithDetails> {
    return prisma.timetable.update({
      where: { id },
      data,
      include: {
        courseOffering: {
          include: {
            department: true,
            program: true,
            semester: true,
            section: true,
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        subject: true,
        section: true,
        room: {
          include: {
            building: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async softDelete(id: number, updatedByUserId: string): Promise<Timetable> {
    return prisma.timetable.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: updatedByUserId,
      },
    });
  }

  // Conflict Checking Methods:
  async findTeacherConflict(teacherId: number, timeSlotId: number, excludeId?: number): Promise<Timetable | null> {
    return prisma.timetable.findFirst({
      where: {
        teacherId,
        timeSlotId,
        deletedAt: null,
        status: { in: ['Active', 'ACTIVE'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }

  async findRoomConflict(roomId: number, timeSlotId: number, excludeId?: number): Promise<Timetable | null> {
    return prisma.timetable.findFirst({
      where: {
        roomId,
        timeSlotId,
        deletedAt: null,
        status: { in: ['Active', 'ACTIVE'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }

  async findSectionConflict(sectionId: number, timeSlotId: number, excludeId?: number): Promise<Timetable | null> {
    return prisma.timetable.findFirst({
      where: {
        sectionId,
        timeSlotId,
        deletedAt: null,
        status: { in: ['Active', 'ACTIVE'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }
}

export const timetableRepository = new TimetableRepository();
export default timetableRepository;
