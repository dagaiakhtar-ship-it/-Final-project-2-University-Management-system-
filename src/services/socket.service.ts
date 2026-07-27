import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export function initSocketServer(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`[Socket] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function notifyTimetableChange(action: 'CREATED' | 'UPDATED' | 'DELETED', payload: any) {
  if (io) {
    // Broadcast general event
    io.emit('timetable:changed', { action, payload });

    // Notify specific teacher's room
    if (payload.teacherId) {
      io.to(`teacher:${payload.teacherId}`).emit('timetable:notification', {
        title: `Schedule ${action.toLowerCase()}`,
        message: `Class schedule for ${payload.subject?.name || 'Subject'} on ${payload.timeSlot?.dayOfWeek} was ${action.toLowerCase()}.`,
        action,
        payload,
      });
    }

    // Notify specific section's room
    if (payload.sectionId) {
      io.to(`section:${payload.sectionId}`).emit('timetable:notification', {
        title: `Schedule ${action.toLowerCase()}`,
        message: `Timetable for Section ${payload.section?.name || 'Section'} was ${action.toLowerCase()}.`,
        action,
        payload,
      });
    }

    // Notify specific room's channel
    if (payload.roomId) {
      io.to(`room:${payload.roomId}`).emit('timetable:notification', {
        title: `Room allocation updated`,
        message: `Allocation for room ${payload.room?.roomNumber || 'Room'} was updated.`,
        action,
        payload,
      });
    }
  }
}

export function notifyAttendanceChange(action: string, payload: any) {
  if (io) {
    io.emit('attendance:changed', { action, payload });
    if (payload.sessionId || payload.attendanceSessionId) {
      const sessId = payload.sessionId || payload.attendanceSessionId;
      io.emit(`attendance:session:${sessId}`, { action, payload });
    }
  }
}

export function notifyLeaveChange(action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED', payload: any) {
  if (io) {
    io.emit('leave:changed', { action, payload });
    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('leave:notification', { action, payload });
    }
    if (payload.teacherId) {
      io.to(`teacher:${payload.teacherId}`).emit('leave:notification', { action, payload });
    }
    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('leave:notification', { action, payload });
  }
}

export function notifyAssignmentChange(action: string, payload: any) {
  if (io) {
    io.emit('assignment:changed', { action, payload });
    if (action === 'PUBLISHED') {
      // Notify all students in the course offering or section
      if (payload.courseOfferingId) {
        io.to(`course:${payload.courseOfferingId}`).emit('assignment:notification', {
          title: 'New Assignment Published',
          message: `A new assignment "${payload.title}" has been published.`,
          action,
          payload,
        });
      }
    } else if (action === 'GRADED') {
      // Notify student
      if (payload.studentId) {
        io.to(`student:${payload.studentId}`).emit('assignment:notification', {
          title: 'Assignment Graded',
          message: `Your submission for "${payload.assignmentTitle || 'Assignment'}" has been graded.`,
          action,
          payload,
        });
      }
    } else if (action === 'SUBMITTED') {
      // Notify teacher
      if (payload.teacherId) {
        io.to(`teacher:${payload.teacherId}`).emit('assignment:notification', {
          title: 'New Submission Received',
          message: `A student has submitted work for "${payload.assignmentTitle || 'Assignment'}".`,
          action,
          payload,
        });
      }
    }
    // General admin broadcast
    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('assignment:admin_notification', { action, payload });
  }
}

export function notifyQuizChange(action: 'PUBLISHED' | 'STARTED' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'GRADED', payload: any) {
  if (io) {
    io.emit('quiz:changed', { action, payload });
    
    if (action === 'PUBLISHED') {
      if (payload.courseOfferingId) {
        io.to(`course:${payload.courseOfferingId}`).emit('quiz:notification', {
          title: 'New Quiz Published',
          message: `A new quiz "${payload.title}" is now available.`,
          action,
          payload,
        });
      }
    } else if (action === 'STARTED') {
      if (payload.teacherId) {
        io.to(`teacher:${payload.teacherId}`).emit('quiz:notification', {
          title: 'Quiz Attempt Started',
          message: `A student has started attempting "${payload.quizTitle || 'Quiz'}".`,
          action,
          payload,
        });
      }
    } else if (action === 'SUBMITTED' || action === 'AUTO_SUBMITTED') {
      if (payload.teacherId) {
        io.to(`teacher:${payload.teacherId}`).emit('quiz:notification', {
          title: action === 'SUBMITTED' ? 'Quiz Submitted' : 'Quiz Auto-Submitted',
          message: `A student has submitted their attempt for "${payload.quizTitle || 'Quiz'}".`,
          action,
          payload,
        });
      }
    } else if (action === 'GRADED') {
      if (payload.studentId) {
        io.to(`student:${payload.studentId}`).emit('quiz:notification', {
          title: 'Quiz Graded',
          message: `Your quiz "${payload.quizTitle || 'Quiz'}" has been graded.`,
          action,
          payload,
        });
      }
    }
    
    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('quiz:admin_notification', { action, payload });
  }
}

export function notifyExamChange(action: 'CREATED' | 'SCHEDULED' | 'CANCELLED' | 'SEAT_PLAN_GENERATED' | 'ADMIT_CARDS_GENERATED' | 'INVIGILATORS_ASSIGNED', payload: any) {
  if (io) {
    io.emit('exam:changed', { action, payload });

    if (action === 'SCHEDULED' || action === 'CANCELLED') {
      if (payload.courseOfferingId) {
        io.to(`course:${payload.courseOfferingId}`).emit('exam:notification', {
          title: `Exam ${action === 'SCHEDULED' ? 'Scheduled' : 'Cancelled'}`,
          message: `The exam "${payload.title || 'Exam'}" was ${action.toLowerCase()}.`,
          action,
          payload,
        });
      }
    } else if (action === 'INVIGILATORS_ASSIGNED') {
      if (payload.teacherIds && Array.isArray(payload.teacherIds)) {
        payload.teacherIds.forEach((teacherId: number) => {
          io.to(`teacher:${teacherId}`).emit('exam:notification', {
            title: 'Assigned as Invigilator',
            message: `You have been assigned as an invigilator for the exam "${payload.title || 'Exam'}".`,
            action,
            payload,
          });
        });
      }
    }

    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('exam:admin_notification', { action, payload });
  }
}

export function notifyResultChange(action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'PUBLISHED' | 'PROCESSED', payload: any) {
  if (io) {
    io.emit('result:changed', { action, payload });

    if (action === 'PUBLISHED') {
      if (payload.studentId) {
        io.to(`student:${payload.studentId}`).emit('result:notification', {
          title: 'Result Published',
          message: `Your final result for "${payload.courseName || 'Course'}" is now available.`,
          action,
          payload,
        });
      }
    } else if (action === 'CREATED' || action === 'UPDATED') {
      // Notify Admin/Super Admin
      io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('result:admin_notification', {
        title: 'Result Marks Updated',
        message: `Marks have been updated for student ID ${payload.studentId} in course offering ${payload.courseOfferingId}.`,
        action,
        payload,
      });
    }

    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('result:global_notification', { action, payload });
  }
}

export function notifyTranscriptChange(action: 'GENERATED' | 'APPROVED' | 'PUBLISHED' | 'REQUESTED' | 'REJECTED' | 'COMPLETED', payload: any) {
  if (io) {
    io.emit('transcript:changed', { action, payload });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('transcript:notification', {
        title: `Transcript ${action.charAt(0) + action.slice(1).toLowerCase()}`,
        message: `Your transcript status has been updated to: ${action.toLowerCase()}.`,
        action,
        payload,
      });
    }

    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:REGISTRAR').emit('transcript:admin_notification', {
      title: `Transcript Notification: ${action}`,
      message: `Transcript action ${action} performed for student ID ${payload.studentId || ''}.`,
      action,
      payload,
    });
  }
}

export function notifyDegreeAuditChange(action: 'AUDIT_RUN' | 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'APPLICATION_GRADUATED', payload: any) {
  if (io) {
    io.emit('degree_audit:changed', { action, payload });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('degree_audit:notification', {
        title: `Degree Audit / Graduation Status`,
        message: `Your graduation application or degree audit is now: ${action.replace('APPLICATION_', '').toLowerCase().replace('_', ' ')}.`,
        action,
        payload,
      });
    }

    // Notify Registrar & Advisor
    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:REGISTRAR').to('role:TEACHER').emit('degree_audit:admin_notification', {
      title: `Degree Audit Notification: ${action}`,
      message: `Action ${action} performed for student ID ${payload.studentId || ''}.`,
      action,
      payload,
    });
  }
}

export function notifyAlumniChange(action: 'REGISTERED' | 'VERIFIED' | 'MENTORSHIP_REQUESTED' | 'MENTORSHIP_UPDATED' | 'EVENT_REGISTERED' | 'DONATION_CONFIRMED' | 'EVENT_UPDATED', payload: any) {
  if (io) {
    io.emit('alumni:changed', { action, payload });

    // Emitting global notification
    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:REGISTRAR').emit('alumni:admin_notification', {
      title: `Alumni Notification: ${action}`,
      message: `Alumni action ${action} triggered.`,
      action,
      payload,
    });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('alumni:notification', {
        title: `Alumni Activity: ${action}`,
        message: `Your alumni request/status is updated: ${action.toLowerCase().replace('_', ' ')}.`,
        action,
        payload,
      });
    }

    if (payload.alumniId) {
      io.emit(`alumni:profile:${payload.alumniId}`, { action, payload });
    }
  }
}

export function notifyPlacementChange(
  action: 'JOB_POSTED' | 'APPLICATION_SUBMITTED' | 'INTERVIEW_SCHEDULED' | 'OFFER_RELEASED' | 'APPLICATION_STATUS_CHANGED',
  payload: any
) {
  if (io) {
    io.emit('placement:changed', { action, payload });

    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:PLACEMENT_OFFICER').emit('placement:admin_notification', {
      title: `Placement Notification: ${action}`,
      message: `Placement action ${action} triggered.`,
      action,
      payload,
    });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('placement:notification', {
        title: `Placement Update: ${action.replace(/_/g, ' ')}`,
        message: `Your placement/application status has updated.`,
        action,
        payload,
      });
    }
  }
}

export function notifyHostelChange(
  action: 'ROOM_ALLOCATED' | 'ROOM_TRANSFERRED' | 'VISITOR_APPROVED' | 'COMPLAINT_UPDATED' | 'MAINTENANCE_STATUS_CHANGED' | 'COMPLAINT_SUBMITTED' | 'MAINTENANCE_SUBMITTED',
  payload: any
) {
  if (io) {
    io.emit('hostel:changed', { action, payload });

    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:HOSTEL_WARDEN').emit('hostel:admin_notification', {
      title: `Hostel Notification: ${action.replace(/_/g, ' ')}`,
      message: `Hostel event ${action.replace(/_/g, ' ')} triggered.`,
      action,
      payload,
    });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('hostel:notification', {
        title: `Hostel Update: ${action.replace(/_/g, ' ')}`,
        message: `Your hostel/accommodation record has been updated.`,
        action,
        payload,
      });
    }
  }
}

export function notifyTransportChange(
  action: 'REGISTRATION_SUBMITTED' | 'PASS_STATUS_CHANGED' | 'ROUTE_UPDATED' | 'DRIVER_CHANGED' | 'MAINTENANCE_ALERT' | 'LICENSE_EXPIRY' | 'ATTENDANCE_MARKED',
  payload: any
) {
  if (io) {
    io.emit('transport:changed', { action, payload });

    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('transport:admin_notification', {
      title: `Transport Notification: ${action.replace(/_/g, ' ')}`,
      message: `Transport event ${action.replace(/_/g, ' ')} triggered.`,
      action,
      payload,
    });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('transport:notification', {
        title: `Transport Update: ${action.replace(/_/g, ' ')}`,
        message: `Your transport record has been updated.`,
        action,
        payload,
      });
    }
  }
}

export function notifyLibraryChange(
  action: 'BOOK_RESERVED' | 'BOOK_AVAILABLE' | 'DUE_DATE_REMINDER' | 'OVERDUE_REMINDER' | 'FINE_GENERATED' | 'BOOK_RETURNED' | 'BOOK_ISSUED',
  payload: any
) {
  if (io) {
    io.emit('library:changed', { action, payload });

    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:LIBRARIAN').emit('library:admin_notification', {
      title: `Library Notification: ${action.replace(/_/g, ' ')}`,
      message: `Library event ${action.replace(/_/g, ' ')} triggered.`,
      action,
      payload,
    });

    if (payload.userId) {
      io.to(`user:${payload.userId}`).emit('library:notification', {
        title: `Library Update: ${action.replace(/_/g, ' ')}`,
        message: payload.message || `A library update has occurred.`,
        action,
        payload,
      });
    }
  }
}

export function notifyFinanceChange(
  action: 'INVOICE_GENERATED' | 'PAYMENT_RECEIVED' | 'RECEIPT_GENERATED' | 'SCHOLARSHIP_APPROVED' | 'REFUND_APPROVED' | 'PAYMENT_REMINDER' | 'OVERDUE_REMINDER',
  payload: any
) {
  if (io) {
    io.emit('finance:changed', { action, payload });

    io.to('role:ADMIN').to('role:SUPER_ADMIN').to('role:FINANCE_OFFICER').emit('finance:admin_notification', {
      title: `Finance Notification: ${action.replace(/_/g, ' ')}`,
      message: payload.message || `A finance update has occurred.`,
      action,
      payload,
    });

    if (payload.studentId) {
      io.to(`student:${payload.studentId}`).emit('finance:notification', {
        title: `Finance Update: ${action.replace(/_/g, ' ')}`,
        message: payload.message || `A finance update has occurred.`,
        action,
        payload,
      });
    }
  }
}

export function notifyProcurementChange(action: string, payload: any) {
  if (io) {
    io.emit('procurement:changed', { action, payload });
  }
}

export function notifyFacilityChange(action: string, payload: any) {
  if (io) {
    io.emit('facility:changed', { action, payload });
  }
}

export function notifyNotificationChange(action: string, payload: any) {
  if (io) {
    io.emit('notification:changed', { action, payload });
    if (payload.userId) {
      io.to(`user:${payload.userId}`).emit('notification:received', payload);
    }
    if (payload.role) {
      io.to(`role:${payload.role}`).emit('notification:received', payload);
    }
  }
}

export function notifyWorkflowChange(action: 'CREATED' | 'UPDATED' | 'EXECUTED' | 'APPROVAL_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SLA_VIOLATED' | 'ESCALATED', payload: any) {
  if (io) {
    io.emit('workflow:changed', { action, payload });
    io.to('role:ADMIN').to('role:SUPER_ADMIN').emit('workflow:admin_notification', { action, payload });
  }
}

export function notifyGRCChange(type: 'audit' | 'policy' | 'risk' | 'evidence', action: string, payload: any) {
  if (io) {
    io.emit('grc:changed', { type, action, payload });
    if (type === 'risk' && (payload.severity === 'Critical' || payload.severity === 'High')) {
      io.emit('grc:risk_alert', { title: 'High/Critical Risk Alert', message: `Critical/High risk registered: ${payload.title}`, payload });
    }
    if (type === 'policy') {
      io.emit('grc:policy_approval', { title: 'Policy Status Update', message: `Policy "${payload.policyName}" status changed to ${payload.status}.`, payload });
    }
    if (type === 'audit') {
      io.emit('grc:audit_event', { title: 'Audit Event Logged', message: `Audit action: ${payload.action} on module ${payload.module}`, payload });
    }
  }
}






