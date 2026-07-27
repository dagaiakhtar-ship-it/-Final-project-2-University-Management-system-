import { prisma } from './db.service';
import { auditService } from './audit.service';
import { notifyLeaveChange } from './socket.service';

export class LeaveService {
  /**
   * Create a new leave request
   */
  async createLeaveRequest(data: any, createdByUsername: string, userId?: number) {
    const {
      applicantType,
      studentId,
      teacherId,
      courseOfferingId,
      leaveType,
      reason,
      startDate,
      endDate,
      supportingDocument,
      remarks,
      affectsAttendance
    } = data;

    // 1. Validation of date ranges
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid start or end date.');
    }
    if (start > end) {
      throw new Error('Start date cannot be after end date.');
    }

    // Security check: supportingDocument must be a valid http or https URL to prevent javascript: XSS
    if (supportingDocument) {
      const trimmedDoc = String(supportingDocument).trim();
      if (trimmedDoc && !trimmedDoc.startsWith('http://') && !trimmedDoc.startsWith('https://')) {
        throw new Error('Supporting document must be a valid HTTP or HTTPS URL.');
      }
    }

    // 2. Calculation of totalDays
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) {
      throw new Error('Leave duration must be at least 1 day.');
    }

    // 3. Resolve departmentId & validate applicant
    let resolvedDepartmentId: number | null = null;
    let studentDetails: any = null;
    let teacherDetails: any = null;

    if (applicantType === 'Student') {
      if (!studentId) throw new Error('Student ID is required for student leave.');
      studentDetails = await prisma.student.findFirst({
        where: { id: Number(studentId), deletedAt: null }
      });
      if (!studentDetails) throw new Error('Student profile not found.');
      resolvedDepartmentId = studentDetails.departmentId;
    } else if (applicantType === 'Teacher') {
      if (!teacherId) throw new Error('Teacher ID is required for teacher leave.');
      teacherDetails = await prisma.teacher.findFirst({
        where: { id: Number(teacherId), deletedAt: null }
      });
      if (!teacherDetails) throw new Error('Teacher profile not found.');
      resolvedDepartmentId = teacherDetails.departmentId;
    } else {
      throw new Error('Invalid applicant type.');
    }

    if (!resolvedDepartmentId) {
      throw new Error('Department could not be resolved for the applicant.');
    }

    // 4. Overlapping leave requests check
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        applicantType,
        studentId: studentId ? Number(studentId) : null,
        teacherId: teacherId ? Number(teacherId) : null,
        status: { in: ['PENDING', 'APPROVED'] },
        deletedAt: null,
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    });

    if (overlap) {
      throw new Error('An overlapping leave request already exists during the specified dates.');
    }

    // 5. Check courseOffering academic session boundaries
    if (courseOfferingId) {
      const offering = await prisma.courseOffering.findFirst({
        where: { id: Number(courseOfferingId), deletedAt: null }
      });
      if (!offering) {
        throw new Error('Course offering not found.');
      }
      if (start < offering.startDate || end > offering.endDate) {
        throw new Error('Leave request dates must fall within the academic session bounds of the course offering.');
      }
    }

    // 6. Generate unique leave number with collision check
    const year = start.getFullYear();
    let leaveNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      leaveNumber = `LV-${year}-${randomSuffix}`;
      const existing = await prisma.leaveRequest.findUnique({
        where: { leaveNumber }
      });
      if (!existing) {
        isUnique = true;
      }
    }
    if (!isUnique) {
      leaveNumber = `LV-${year}-${Date.now().toString().slice(-6)}`;
    }

    // 7. Create LeaveRequest in DB
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        leaveNumber,
        applicantType,
        studentId: studentId ? Number(studentId) : null,
        teacherId: teacherId ? Number(teacherId) : null,
        departmentId: resolvedDepartmentId,
        courseOfferingId: courseOfferingId ? Number(courseOfferingId) : null,
        leaveType,
        reason,
        startDate: start,
        endDate: end,
        totalDays,
        supportingDocument: supportingDocument || null,
        status: 'PENDING',
        affectsAttendance: affectsAttendance !== undefined ? Boolean(affectsAttendance) : true,
        attendanceAdjustmentStatus: 'Pending',
        remarks: remarks || null,
        createdBy: createdByUsername,
        updatedBy: createdByUsername
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: true,
        courseOffering: {
          include: {
            subject: true
          }
        }
      }
    });

    // 8. Log Audit
    await auditService.log({
      action: 'LEAVE_CREATED',
      tableName: 'LeaveRequest',
      recordId: String(leaveRequest.id),
      newValue: leaveRequest,
      userId
    });

    // 9. Realtime notification
    notifyLeaveChange('SUBMITTED', leaveRequest);

    return leaveRequest;
  }

  /**
   * Get filtered and paginated leave requests list
   */
  async getLeaveRequests(filters: any) {
    const {
      search,
      applicantType,
      departmentId,
      leaveType,
      status,
      startDate,
      endDate,
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = filters;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build conditions
    const whereConditions: any = { deletedAt: null };

    if (applicantType) {
      whereConditions.applicantType = applicantType;
    }
    if (departmentId) {
      whereConditions.departmentId = Number(departmentId);
    }
    if (leaveType) {
      whereConditions.leaveType = leaveType;
    }
    if (status) {
      whereConditions.status = status;
    }
    if (startDate) {
      whereConditions.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereConditions.endDate = { lte: new Date(endDate) };
    }

    if (search) {
      whereConditions.OR = [
        { leaveNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { student: { fullName: { contains: search, mode: 'insensitive' } } },
        { student: { registrationNumber: { contains: search, mode: 'insensitive' } } },
        { teacher: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { teacher: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { teacher: { employeeId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build ordering
    const orderBy: any = {};
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Execute queries
    const [total, data] = await Promise.all([
      prisma.leaveRequest.count({ where: whereConditions }),
      prisma.leaveRequest.findMany({
        where: whereConditions,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              registrationNumber: true,
              rollNumber: true
            }
          },
          teacher: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          courseOffering: {
            include: {
              subject: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      })
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data
    };
  }

  /**
   * Get details of a single leave request
   */
  async getLeaveDetails(id: number) {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true,
            userId: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        courseOffering: {
          include: {
            subject: true,
            teacher: true
          }
        }
      }
    });

    if (!leave) {
      throw new Error('Leave request not found.');
    }

    return leave;
  }

  /**
   * Approve a leave request and adjust attendance
   */
  async approveLeaveRequest(id: number, approvedByUsername: string, userId?: number) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { student: true, teacher: true }
    });

    if (!leave) throw new Error('Leave request not found.');
    if (leave.status !== 'PENDING') {
      throw new Error('Only pending leave requests can be approved.');
    }

    // Update status to APPROVED
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approvedByUsername,
        approvalDate: new Date(),
        updatedBy: approvedByUsername
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Handle Attendance integration if it affects attendance and applicant is a Student
    if (updatedLeave.affectsAttendance && updatedLeave.applicantType === 'Student' && updatedLeave.studentId) {
      try {
        const startOfDay = new Date(updatedLeave.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(updatedLeave.endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await prisma.attendanceSession.findMany({
          where: {
            attendanceDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            courseOfferingId: updatedLeave.courseOfferingId ? updatedLeave.courseOfferingId : undefined,
          }
        });

        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
          const existingRecords = await prisma.attendanceRecord.findMany({
            where: {
              studentId: updatedLeave.studentId,
              attendanceSessionId: { in: sessionIds }
            }
          });

          for (const rec of existingRecords) {
            const originalStatus = rec.attendanceStatus;
            const updatedRemarks = `[Leave Approved: ${updatedLeave.leaveNumber}] (Prev: ${originalStatus}). ${rec.remarks || ''}`.slice(0, 500);

            await prisma.attendanceRecord.update({
              where: { id: rec.id },
              data: {
                attendanceStatus: 'Excused',
                remarks: updatedRemarks,
                editedBy: approvedByUsername,
                editReason: `Leave Request ${updatedLeave.leaveNumber} Approved`
              }
            });
          }

          await prisma.leaveRequest.update({
            where: { id: updatedLeave.id },
            data: { attendanceAdjustmentStatus: 'Adjusted' }
          });
        }
      } catch (attError) {
        console.error('Failed to adjust attendance for approved leave:', attError);
      }
    }

    // Log Audit
    await auditService.log({
      action: 'LEAVE_APPROVED',
      tableName: 'LeaveRequest',
      recordId: String(updatedLeave.id),
      newValue: updatedLeave,
      userId
    });

    // Realtime notification
    notifyLeaveChange('APPROVED', updatedLeave);

    return updatedLeave;
  }

  /**
   * Reject a leave request
   */
  async rejectLeaveRequest(id: number, rejectedByUsername: string, rejectionReason: string, userId?: number) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leave) throw new Error('Leave request not found.');
    if (leave.status !== 'PENDING') {
      throw new Error('Only pending leave requests can be rejected.');
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        updatedBy: rejectedByUsername
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log Audit
    await auditService.log({
      action: 'LEAVE_REJECTED',
      tableName: 'LeaveRequest',
      recordId: String(updatedLeave.id),
      newValue: updatedLeave,
      userId
    });

    // Realtime notification
    notifyLeaveChange('REJECTED', updatedLeave);

    return updatedLeave;
  }

  /**
   * Cancel a leave request and restore original attendance records
   */
  async cancelLeaveRequest(id: number, cancelledByUsername: string, userId?: number) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leave) throw new Error('Leave request not found.');
    if (leave.status === 'CANCELLED') {
      throw new Error('Leave request is already cancelled.');
    }

    const wasApproved = leave.status === 'APPROVED';

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedBy: cancelledByUsername
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Restore original attendance if previously approved
    if (wasApproved && leave.affectsAttendance && leave.applicantType === 'Student' && leave.studentId) {
      try {
        const startOfDay = new Date(leave.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(leave.endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await prisma.attendanceSession.findMany({
          where: {
            attendanceDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            courseOfferingId: leave.courseOfferingId ? leave.courseOfferingId : undefined
          }
        });

        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
          const records = await prisma.attendanceRecord.findMany({
            where: {
              studentId: leave.studentId,
              attendanceSessionId: { in: sessionIds },
              attendanceStatus: 'Excused',
              remarks: { contains: `[Leave Approved: ${leave.leaveNumber}]` }
            }
          });

          for (const rec of records) {
            let restoredStatus = 'Absent';
            const match = rec.remarks?.match(/\(Prev: (\w+)\)/);
            if (match && match[1]) {
              restoredStatus = match[1];
            }

            const cleanedRemarks = rec.remarks?.replace(/\[Leave Approved: [^\]]+\] \(Prev: [^\)]+\)\.?\s*/, '') || '';

            await prisma.attendanceRecord.update({
              where: { id: rec.id },
              data: {
                attendanceStatus: restoredStatus,
                remarks: cleanedRemarks || null,
                editedBy: cancelledByUsername,
                editReason: `Leave Request ${leave.leaveNumber} Cancelled - Restored original status`
              }
            });
          }

          await prisma.leaveRequest.update({
            where: { id: updatedLeave.id },
            data: { attendanceAdjustmentStatus: 'Restored' }
          });
        }
      } catch (attError) {
        console.error('Failed to restore attendance for cancelled leave:', attError);
      }
    }

    // Log Audit
    await auditService.log({
      action: 'LEAVE_CANCELLED',
      tableName: 'LeaveRequest',
      recordId: String(updatedLeave.id),
      newValue: updatedLeave,
      userId
    });

    // Realtime notification
    notifyLeaveChange('CANCELLED', updatedLeave);

    return updatedLeave;
  }

  /**
   * Update a leave request details (only if PENDING)
   */
  async updateLeaveRequest(id: number, data: any, updatedByUsername: string, userId?: number) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leave) throw new Error('Leave request not found.');
    if (leave.status !== 'PENDING') {
      throw new Error('Only pending leave requests can be updated.');
    }

    const {
      leaveType,
      reason,
      startDate,
      endDate,
      supportingDocument,
      remarks,
      affectsAttendance,
      courseOfferingId
    } = data;

    const start = startDate ? new Date(startDate) : leave.startDate;
    const end = endDate ? new Date(endDate) : leave.endDate;

    if (start > end) {
      throw new Error('Start date cannot be after end date.');
    }

    // Security check: supportingDocument must be a valid http or https URL to prevent javascript: XSS
    if (supportingDocument !== undefined && supportingDocument !== null) {
      const trimmedDoc = String(supportingDocument).trim();
      if (trimmedDoc && !trimmedDoc.startsWith('http://') && !trimmedDoc.startsWith('https://')) {
        throw new Error('Supporting document must be a valid HTTP or HTTPS URL.');
      }
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check overlaps (excluding this request itself)
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        id: { not: id },
        applicantType: leave.applicantType,
        studentId: leave.studentId,
        teacherId: leave.teacherId,
        status: { in: ['PENDING', 'APPROVED'] },
        deletedAt: null,
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    });

    if (overlap) {
      throw new Error('An overlapping leave request already exists during the specified dates.');
    }

    // Check boundaries
    const resolvedCourseOfferingId = courseOfferingId !== undefined ? (courseOfferingId ? Number(courseOfferingId) : null) : leave.courseOfferingId;
    if (resolvedCourseOfferingId) {
      const offering = await prisma.courseOffering.findFirst({
        where: { id: resolvedCourseOfferingId, deletedAt: null }
      });
      if (!offering) {
        throw new Error('Course offering not found.');
      }
      if (start < offering.startDate || end > offering.endDate) {
        throw new Error('Leave request dates must fall within the academic session bounds of the course offering.');
      }
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        leaveType: leaveType || leave.leaveType,
        reason: reason || leave.reason,
        startDate: start,
        endDate: end,
        totalDays,
        supportingDocument: supportingDocument !== undefined ? supportingDocument : leave.supportingDocument,
        remarks: remarks !== undefined ? remarks : leave.remarks,
        affectsAttendance: affectsAttendance !== undefined ? Boolean(affectsAttendance) : leave.affectsAttendance,
        courseOfferingId: resolvedCourseOfferingId,
        updatedBy: updatedByUsername
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            rollNumber: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log Audit
    await auditService.log({
      action: 'LEAVE_UPDATED',
      tableName: 'LeaveRequest',
      recordId: String(updatedLeave.id),
      newValue: updatedLeave,
      userId
    });

    return updatedLeave;
  }

  /**
   * Soft delete a leave request (only if PENDING or CANCELLED)
   */
  async deleteLeaveRequest(id: number, deletedByUsername: string, userId?: number) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leave) throw new Error('Leave request not found.');
    if (leave.status === 'APPROVED') {
      throw new Error('Approved leave requests cannot be deleted. Cancel it first.');
    }

    const deletedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedByUsername
      }
    });

    // Log Audit
    await auditService.log({
      action: 'LEAVE_DELETED',
      tableName: 'LeaveRequest',
      recordId: String(deletedLeave.id),
      userId
    });

    return deletedLeave;
  }

  /**
   * Get student leaves
   */
  async getStudentLeaves(studentId: number) {
    return prisma.leaveRequest.findMany({
      where: { studentId: Number(studentId), deletedAt: null },
      include: {
        department: {
          select: { name: true, code: true }
        },
        courseOffering: {
          include: { subject: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get teacher leaves
   */
  async getTeacherLeaves(teacherId: number) {
    return prisma.leaveRequest.findMany({
      where: { teacherId: Number(teacherId), deletedAt: null },
      include: {
        department: {
          select: { name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const leaveService = new LeaveService();
export default leaveService;
