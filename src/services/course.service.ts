import { prisma } from './db.service';
import { auditService } from './audit.service';

export interface CourseFilterParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CourseService {
  async getCourses(params: CourseFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          subjects: {
            include: {
              department: true,
              program: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      total,
      page,
      limit,
    };
  }

  async getCourseByUuid(uuid: string) {
    const course = await prisma.course.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        subjects: {
          include: {
            department: true,
            program: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async createCourse(
    data: {
      name: string;
      code: string;
      credits: number;
      description?: string;
      status?: string;
    },
    userId: number
  ) {
    // Check if code is duplicate
    const existing = await prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      if (existing.deletedAt) {
        // Restore
        const restored = await prisma.course.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            credits: data.credits,
            description: data.description || null,
            status: data.status || 'ACTIVE',
            deletedAt: null,
          },
        });
        await auditService.log({
          action: 'COURSE_RESTORE',
          tableName: 'Course',
          recordId: String(restored.id),
          userId,
          details: `Restored course ${data.code}`,
        } as any);
        return restored;
      }
      throw new Error('Course with this code already exists');
    }

    const course = await prisma.course.create({
      data: {
        name: data.name,
        code: data.code,
        credits: data.credits,
        description: data.description || null,
        status: data.status || 'ACTIVE',
        createdBy: String(userId),
      },
    });

    await auditService.log({
      action: 'COURSE_CREATE',
      tableName: 'Course',
      recordId: String(course.id),
      userId,
      details: `Created course ${data.code}: ${data.name}`,
    } as any);

    return course;
  }

  async updateCourseByUuid(
    uuid: string,
    data: {
      name?: string;
      code?: string;
      credits?: number;
      description?: string;
      status?: string;
    },
    userId: number
  ) {
    const course = await this.getCourseByUuid(uuid);

    if (data.code && data.code !== course.code) {
      const existing = await prisma.course.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new Error('Course with this code already exists');
      }
    }

    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        ...data,
        updatedBy: String(userId),
      },
    });

    await auditService.log({
      action: 'COURSE_UPDATE',
      tableName: 'Course',
      recordId: String(course.id),
      userId,
      details: `Updated course ${course.code}`,
    } as any);

    return updated;
  }

  async deleteCourseByUuid(uuid: string, userId: number) {
    const course = await this.getCourseByUuid(uuid);

    await prisma.course.update({
      where: { id: course.id },
      data: {
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });

    await auditService.log({
      action: 'COURSE_DELETE',
      tableName: 'Course',
      recordId: String(course.id),
      userId,
      details: `Deleted course ${course.code}`,
    } as any);
  }
}

export const courseService = new CourseService();
