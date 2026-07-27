import { PrismaClient, Gender, UserRole, SemesterStatus, SemesterType, AcademicStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Database seeding initiated with robust demo data...');

  // 1. Ensure Roles exist
  console.log('Seeding Roles...');
  const roles = [
    { name: UserRole.SUPER_ADMIN, description: 'Super Administrator with full access' },
    { name: UserRole.ADMIN, description: 'Administrator with management access' },
    { name: UserRole.TEACHER, description: 'Faculty member / Teacher profile' },
    { name: UserRole.STUDENT, description: 'Student profile' },
    { name: UserRole.PARENT, description: 'Parent profile' },
    { name: UserRole.RECRUITER, description: 'Recruiter profile' },
    { name: UserRole.PLACEMENT_OFFICER, description: 'Placement Officer profile' },
    { name: UserRole.HOSTEL_WARDEN, description: 'Hostel Warden' },
    { name: UserRole.SECURITY_STAFF, description: 'Security Staff' },
    { name: UserRole.LIBRARIAN, description: 'Librarian' },
    { name: UserRole.COMPLIANCE_OFFICER, description: 'Compliance Officer' },
    { name: UserRole.INTERNAL_AUDITOR, description: 'Internal Auditor' },
    { name: UserRole.RISK_MANAGER, description: 'Risk Manager' },
    { name: UserRole.AUDITOR, description: 'Auditor' },
  ];

  const roleMap: Record<UserRole, number> = {} as any;
  for (const r of roles) {
    const existingRole = await prisma.role.findUnique({ where: { name: r.name } });
    if (existingRole) {
      roleMap[r.name] = existingRole.id;
    } else {
      const newRole = await prisma.role.create({ data: r });
      roleMap[r.name] = newRole.id;
    }
  }

  // 2. Ensure University exists
  console.log('Seeding University...');
  let university = await prisma.university.findFirst();
  if (!university) {
    university = await prisma.university.create({
      data: {
        name: 'Smart University',
        code: 'SMART-UNI',
        address: '123 University Ave, Academic City',
        contactEmail: 'info@university.edu',
        contactPhone: '+1-555-0199',
        status: 'ACTIVE',
      },
    });
  }

  // 3. Ensure Academic Year exists
  console.log('Seeding Academic Year...');
  let academicYear = await prisma.academicYear.findUnique({ where: { name: '2025-2026' } });
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2025-2026',
        startDate: new Date('2025-09-01T00:00:00Z'),
        endDate: new Date('2026-06-30T00:00:00Z'),
        status: AcademicStatus.ACTIVE,
      },
    });
  }

  // 4. Ensure Departments exist
  console.log('Seeding Departments...');
  const departmentsData = [
    { name: 'Computer Science', code: 'CS', shortName: 'CS', description: 'Department of Computer Science & Engineering', faculty: 'Faculty of Engineering & Technology' },
    { name: 'Electrical Engineering', code: 'EE', shortName: 'EE', description: 'Department of Electrical Engineering', faculty: 'Faculty of Engineering & Technology' },
    { name: 'Business Administration', code: 'BA', shortName: 'BA', description: 'Department of Business Administration', faculty: 'Faculty of Management & Social Sciences' },
    { name: 'Mechanical Engineering', code: 'ME', shortName: 'ME', description: 'Department of Mechanical Engineering', faculty: 'Faculty of Engineering & Technology' }
  ];

  const departmentMap: Record<string, any> = {};
  for (const dept of departmentsData) {
    let d = await prisma.department.findUnique({ where: { code: dept.code } });
    if (!d) {
      d = await prisma.department.create({
        data: {
          ...dept,
          universityId: university.id,
          status: 'ACTIVE'
        }
      });
    }
    departmentMap[dept.code] = d;
  }

  // 5. Ensure Programs exist
  console.log('Seeding Programs...');
  const programsData = [
    { name: 'Bachelor of Science in Computer Science', code: 'BSCS', shortName: 'BSCS', degreeLevel: 'BS', duration: 8, totalSemesters: 8, creditHours: 130, departmentCode: 'CS' },
    { name: 'Bachelor of Science in Electrical Engineering', code: 'BSEE', shortName: 'BSEE', degreeLevel: 'BS', duration: 8, totalSemesters: 8, creditHours: 132, departmentCode: 'EE' },
    { name: 'Master of Business Administration', code: 'MBA', shortName: 'MBA', degreeLevel: 'MS', duration: 4, totalSemesters: 4, creditHours: 72, departmentCode: 'BA' }
  ];

  const programMap: Record<string, any> = {};
  for (const prog of programsData) {
    let p = await prisma.program.findUnique({ where: { code: prog.code } });
    if (!p) {
      p = await prisma.program.create({
        data: {
          name: prog.name,
          code: prog.code,
          shortName: prog.shortName,
          degreeLevel: prog.degreeLevel,
          duration: prog.duration,
          totalSemesters: prog.totalSemesters,
          creditHours: prog.creditHours,
          status: 'ACTIVE',
          departmentId: departmentMap[prog.departmentCode].id
        }
      });
    }
    programMap[prog.code] = p;
  }

  // 6. Ensure Semesters exist
  console.log('Seeding Semesters...');
  const semesterData = [
    { name: 'Fall 2025 (CS)', code: 'FALL2025-CS', semesterNumber: 1, programCode: 'BSCS' },
    { name: 'Fall 2025 (EE)', code: 'FALL2025-EE', semesterNumber: 1, programCode: 'BSEE' },
    { name: 'Fall 2025 (BA)', code: 'FALL2025-BA', semesterNumber: 1, programCode: 'MBA' }
  ];

  const semesterMap: Record<string, any> = {};
  for (const sem of semesterData) {
    let s = await prisma.semester.findFirst({
      where: { code: sem.code, programId: programMap[sem.programCode].id }
    });
    if (!s) {
      s = await prisma.semester.create({
        data: {
          name: sem.name,
          code: sem.code,
          semesterNumber: sem.semesterNumber,
          semesterType: SemesterType.REGULAR,
          status: SemesterStatus.ACTIVE,
          startDate: new Date('2025-09-01T00:00:00Z'),
          endDate: new Date('2026-01-31T00:00:00Z'),
          registrationStartDate: new Date('2025-08-01T00:00:00Z'),
          registrationEndDate: new Date('2025-08-31T00:00:00Z'),
          programId: programMap[sem.programCode].id,
          academicYearId: academicYear.id,
        }
      });
    }
    semesterMap[sem.code] = s;
  }

  // Hashing password for seed users
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('Password@123', saltRounds);

  // 7. Seed Admin User
  console.log('Seeding Admin User...');
  const adminEmail = 'admin@university.edu';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        gender: Gender.MALE,
        status: 'ACTIVE',
        isEmailVerified: true,
        isActive: true,
        roleId: roleMap[UserRole.SUPER_ADMIN],
      },
    });
  }

  let adminProfile = await prisma.admin.findUnique({ where: { userId: adminUser.id } });
  if (!adminProfile) {
    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        department: 'Information Technology',
        status: 'ACTIVE',
      },
    });
  }

  // 8. Seed Teacher Users
  console.log('Seeding Teacher Users...');
  const teachersData = [
    { email: 'teacher@university.edu', firstName: 'Sarah', lastName: 'Connor', gender: Gender.FEMALE, employeeId: 'T-1000', designation: 'Senior Professor', departmentCode: 'CS', qualification: 'Ph.D. in Computer Science', specialization: 'Artificial Intelligence', experience: 15, officeLocation: 'Block C, Room 402' },
    { email: 'banner@university.edu', firstName: 'Bruce', lastName: 'Banner', gender: Gender.MALE, employeeId: 'T-1001', designation: 'Professor', departmentCode: 'EE', qualification: 'Ph.D. in Nuclear Engineering', specialization: 'Signals & Systems', experience: 12, officeLocation: 'Block B, Room 204' },
    { email: 'stark@university.edu', firstName: 'Tony', lastName: 'Stark', gender: Gender.MALE, employeeId: 'T-1002', designation: 'Professor', departmentCode: 'EE', qualification: 'Ph.D. in Robotics', specialization: 'Embedded & Power Systems', experience: 18, officeLocation: 'Stark Labs, Room 101' },
    { email: 'xavier@university.edu', firstName: 'Charles', lastName: 'Xavier', gender: Gender.MALE, employeeId: 'T-1003', designation: 'Dean & Professor', departmentCode: 'BA', qualification: 'Ph.D. in Psychology', specialization: 'Organizational Behavior', experience: 22, officeLocation: 'Mansion Office, Block A' }
  ];

  const teacherMap: Record<string, any> = {};
  for (const t of teachersData) {
    let tUser = await prisma.user.findUnique({ where: { email: t.email } });
    if (!tUser) {
      tUser = await prisma.user.create({
        data: {
          email: t.email,
          password: hashedPassword,
          firstName: t.firstName,
          lastName: t.lastName,
          gender: t.gender,
          status: 'ACTIVE',
          isEmailVerified: true,
          isActive: true,
          roleId: roleMap[UserRole.TEACHER],
        }
      });
    }

    let tProfile = await prisma.teacher.findUnique({ where: { employeeId: t.employeeId } });
    if (!tProfile) {
      tProfile = await prisma.teacher.create({
        data: {
          userId: tUser.id,
          employeeId: t.employeeId,
          designation: t.designation,
          status: 'ACTIVE',
          departmentId: departmentMap[t.departmentCode].id,
          employmentType: 'Permanent',
          qualification: t.qualification,
          specialization: t.specialization,
          experience: t.experience,
          joiningDate: new Date('2020-01-15T00:00:00Z'),
          officeLocation: t.officeLocation,
        }
      });
    }
    teacherMap[t.email] = tProfile;
  }

  // 9. Seed Courses
  console.log('Seeding Courses...');
  const coursesData = [
    { code: 'CS101', name: 'Introduction to Programming', credits: 3 },
    { code: 'CS201', name: 'Data Structures & Algorithms', credits: 4 },
    { code: 'EE101', name: 'Circuit Analysis', credits: 3 },
    { code: 'EE201', name: 'Digital Logic Design', credits: 4 },
    { code: 'BA101', name: 'Organizational Behavior', credits: 3 },
    { code: 'BA201', name: 'Strategic Management', credits: 3 }
  ];

  const courseMap: Record<string, any> = {};
  for (const c of coursesData) {
    let crs = await prisma.course.findUnique({ where: { code: c.code } });
    if (!crs) {
      crs = await prisma.course.create({
        data: {
          code: c.code,
          name: c.name,
          credits: c.credits,
          status: 'ACTIVE'
        }
      });
    }
    courseMap[c.code] = crs;
  }

  // 10. Seed Subjects
  console.log('Seeding Subjects...');
  const subjectsData = [
    { code: 'CS101-SUB', name: 'Introduction to Programming', creditHours: 3, departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS', courseCode: 'CS101', teacherEmail: 'teacher@university.edu' },
    { code: 'CS201-SUB', name: 'Data Structures & Algorithms', creditHours: 4, departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS', courseCode: 'CS201', teacherEmail: 'teacher@university.edu' },
    { code: 'EE101-SUB', name: 'Circuit Analysis', creditHours: 3, departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE', courseCode: 'EE101', teacherEmail: 'stark@university.edu' },
    { code: 'EE201-SUB', name: 'Digital Logic Design', creditHours: 4, departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE', courseCode: 'EE201', teacherEmail: 'banner@university.edu' },
    { code: 'BA101-SUB', name: 'Organizational Behavior', creditHours: 3, departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA', courseCode: 'BA101', teacherEmail: 'xavier@university.edu' },
    { code: 'BA201-SUB', name: 'Strategic Management', creditHours: 3, departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA', courseCode: 'BA201', teacherEmail: 'xavier@university.edu' }
  ];

  const subjectMap: Record<string, any> = {};
  for (const s of subjectsData) {
    let sub = await prisma.subject.findUnique({ where: { code: s.code } });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          code: s.code,
          name: s.name,
          creditHours: s.creditHours,
          departmentId: departmentMap[s.departmentCode].id,
          programId: programMap[s.programCode].id,
          semesterId: semesterMap[s.semesterCode].id,
          courseId: courseMap[s.courseCode].id,
          teacherId: teacherMap[s.teacherEmail].id,
          status: 'ACTIVE'
        }
      });
    }
    subjectMap[s.code] = sub;
  }

  // 11. Seed Sections
  console.log('Seeding Sections...');
  const sectionsData = [
    { code: 'CS-A', name: 'Computer Science Section A', semesterCode: 'FALL2025-CS', programCode: 'BSCS', departmentCode: 'CS', teacherEmail: 'teacher@university.edu' },
    { code: 'EE-A', name: 'Electrical Engineering Section A', semesterCode: 'FALL2025-EE', programCode: 'BSEE', departmentCode: 'EE', teacherEmail: 'stark@university.edu' },
    { code: 'BA-A', name: 'Business Administration Section A', semesterCode: 'FALL2025-BA', programCode: 'MBA', departmentCode: 'BA', teacherEmail: 'xavier@university.edu' }
  ];

  const sectionMap: Record<string, any> = {};
  for (const sec of sectionsData) {
    let s = await prisma.section.findFirst({
      where: { code: sec.code, semesterId: semesterMap[sec.semesterCode].id }
    });
    if (!s) {
      s = await prisma.section.create({
        data: {
          code: sec.code,
          name: sec.name,
          status: 'ACTIVE',
          capacity: 60,
          currentStrength: 0,
          shift: 'MORNING',
          semesterId: semesterMap[sec.semesterCode].id,
          programId: programMap[sec.programCode].id,
          departmentId: departmentMap[sec.departmentCode].id,
          academicYearId: academicYear.id,
          classAdvisorId: teacherMap[sec.teacherEmail].id
        }
      });
    }
    sectionMap[sec.code] = s;
  }

  // 12. Seed Student Users & Profiles
  console.log('Seeding Student Users...');
  const studentsData = [
    { email: 'student@university.edu', firstName: 'John', lastName: 'Doe', gender: Gender.MALE, registrationNumber: 'REG-2025-0001', rollNumber: 'CS-2025-042', idCardNumber: 'IDC-2025-9988', departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS' },
    { email: 'alice.smith@university.edu', firstName: 'Alice', lastName: 'Smith', gender: Gender.FEMALE, registrationNumber: 'REG-2025-0002', rollNumber: 'CS-2025-043', idCardNumber: 'IDC-2025-1111', departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS' },
    { email: 'bob.johnson@university.edu', firstName: 'Bob', lastName: 'Johnson', gender: Gender.MALE, registrationNumber: 'REG-2025-0003', rollNumber: 'CS-2025-044', idCardNumber: 'IDC-2025-2222', departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS' },
    { email: 'peter.parker@university.edu', firstName: 'Peter', lastName: 'Parker', gender: Gender.MALE, registrationNumber: 'REG-2025-0004', rollNumber: 'EE-2025-001', idCardNumber: 'IDC-2025-3333', departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE' },
    { email: 'clark.kent@university.edu', firstName: 'Clark', lastName: 'Kent', gender: Gender.MALE, registrationNumber: 'REG-2025-0005', rollNumber: 'EE-2025-002', idCardNumber: 'IDC-2025-4444', departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE' },
    { email: 'bruce.wayne@university.edu', firstName: 'Bruce', lastName: 'Wayne', gender: Gender.MALE, registrationNumber: 'REG-2025-0006', rollNumber: 'BA-2025-001', idCardNumber: 'IDC-2025-5555', departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA' },
    { email: 'diana.prince@university.edu', firstName: 'Diana', lastName: 'Prince', gender: Gender.FEMALE, registrationNumber: 'REG-2025-0007', rollNumber: 'BA-2025-002', idCardNumber: 'IDC-2025-6666', departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA' }
  ];

  const studentMap: Record<string, any> = {};
  for (const s of studentsData) {
    let sUser = await prisma.user.findUnique({ where: { email: s.email } });
    if (!sUser) {
      sUser = await prisma.user.create({
        data: {
          email: s.email,
          password: hashedPassword,
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          status: 'ACTIVE',
          isEmailVerified: true,
          isActive: true,
          roleId: roleMap[UserRole.STUDENT],
        }
      });
    }

    let sProfile = await prisma.student.findUnique({ where: { registrationNumber: s.registrationNumber } });
    if (!sProfile) {
      sProfile = await prisma.student.create({
        data: {
          userId: sUser.id,
          registrationNumber: s.registrationNumber,
          rollNumber: s.rollNumber,
          idCardNumber: s.idCardNumber,
          fullName: `${s.firstName} ${s.lastName}`,
          status: AcademicStatus.ACTIVE,
          enrollmentStatus: 'Enrolled',
          departmentId: departmentMap[s.departmentCode].id,
          programId: programMap[s.programCode].id,
          semesterId: semesterMap[s.semesterCode].id,
          academicYearId: academicYear.id,
        }
      });
    }
    studentMap[s.email] = sProfile;
  }

  // 13. Seed CourseOfferings
  console.log('Seeding Course Offerings...');
  const courseOfferingsData = [
    { courseCode: 'CO-CS101', departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS', sectionCode: 'CS-A', subjectCode: 'CS101-SUB', teacherEmail: 'teacher@university.edu', session: 'Fall' },
    { courseCode: 'CO-CS201', departmentCode: 'CS', programCode: 'BSCS', semesterCode: 'FALL2025-CS', sectionCode: 'CS-A', subjectCode: 'CS201-SUB', teacherEmail: 'teacher@university.edu', session: 'Fall' },
    { courseCode: 'CO-EE101', departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE', sectionCode: 'EE-A', subjectCode: 'EE101-SUB', teacherEmail: 'stark@university.edu', session: 'Fall' },
    { courseCode: 'CO-EE201', departmentCode: 'EE', programCode: 'BSEE', semesterCode: 'FALL2025-EE', sectionCode: 'EE-A', subjectCode: 'EE201-SUB', teacherEmail: 'banner@university.edu', session: 'Fall' },
    { courseCode: 'CO-BA101', departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA', sectionCode: 'BA-A', subjectCode: 'BA101-SUB', teacherEmail: 'xavier@university.edu', session: 'Fall' },
    { courseCode: 'CO-BA201', departmentCode: 'BA', programCode: 'MBA', semesterCode: 'FALL2025-BA', sectionCode: 'BA-A', subjectCode: 'BA201-SUB', teacherEmail: 'xavier@university.edu', session: 'Fall' }
  ];

  const offeringMap: Record<string, any> = {};
  for (const co of courseOfferingsData) {
    let offering = await prisma.courseOffering.findUnique({ where: { courseCode: co.courseCode } });
    if (!offering) {
      offering = await prisma.courseOffering.create({
        data: {
          courseCode: co.courseCode,
          departmentId: departmentMap[co.departmentCode].id,
          programId: programMap[co.programCode].id,
          semesterId: semesterMap[co.semesterCode].id,
          sectionId: sectionMap[co.sectionCode].id,
          subjectId: subjectMap[co.subjectCode].id,
          teacherId: teacherMap[co.teacherEmail].id,
          academicYear: '2025-2026',
          session: co.session,
          startDate: new Date('2025-09-01T00:00:00Z'),
          endDate: new Date('2026-01-31T00:00:00Z'),
          weeklyLectureHours: 3,
          weeklyLabHours: co.subjectCode.includes('CS') ? 2 : 0,
          status: 'Active',
          description: `Core offering for ${co.courseCode}`
        }
      });
    }
    offeringMap[co.courseCode] = offering;
  }

  // 14. Seed Enrollments
  console.log('Seeding Enrollments...');
  const enrollmentsData = [
    // CS students
    { studentEmail: 'student@university.edu', offeringCode: 'CO-CS101', enrollmentNumber: 'ENR-2025-001' },
    { studentEmail: 'student@university.edu', offeringCode: 'CO-CS201', enrollmentNumber: 'ENR-2025-002' },
    { studentEmail: 'alice.smith@university.edu', offeringCode: 'CO-CS101', enrollmentNumber: 'ENR-2025-003' },
    { studentEmail: 'alice.smith@university.edu', offeringCode: 'CO-CS201', enrollmentNumber: 'ENR-2025-004' },
    { studentEmail: 'bob.johnson@university.edu', offeringCode: 'CO-CS101', enrollmentNumber: 'ENR-2025-005' },
    { studentEmail: 'bob.johnson@university.edu', offeringCode: 'CO-CS201', enrollmentNumber: 'ENR-2025-006' },
    // EE students
    { studentEmail: 'peter.parker@university.edu', offeringCode: 'CO-EE101', enrollmentNumber: 'ENR-2025-007' },
    { studentEmail: 'peter.parker@university.edu', offeringCode: 'CO-EE201', enrollmentNumber: 'ENR-2025-008' },
    { studentEmail: 'clark.kent@university.edu', offeringCode: 'CO-EE101', enrollmentNumber: 'ENR-2025-009' },
    { studentEmail: 'clark.kent@university.edu', offeringCode: 'CO-EE201', enrollmentNumber: 'ENR-2025-010' },
    // BA students
    { studentEmail: 'bruce.wayne@university.edu', offeringCode: 'CO-BA101', enrollmentNumber: 'ENR-2025-011' },
    { studentEmail: 'bruce.wayne@university.edu', offeringCode: 'CO-BA201', enrollmentNumber: 'ENR-2025-012' },
    { studentEmail: 'diana.prince@university.edu', offeringCode: 'CO-BA101', enrollmentNumber: 'ENR-2025-013' },
    { studentEmail: 'diana.prince@university.edu', offeringCode: 'CO-BA201', enrollmentNumber: 'ENR-2025-014' }
  ];

  for (const e of enrollmentsData) {
    let enrollment = await prisma.enrollment.findUnique({ where: { enrollmentNumber: e.enrollmentNumber } });
    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          enrollmentNumber: e.enrollmentNumber,
          studentId: studentMap[e.studentEmail].id,
          courseOfferingId: offeringMap[e.offeringCode].id,
          academicYear: '2025-2026',
          session: 'Fall',
          status: 'Enrolled',
          enrollmentType: 'Regular',
          creditsRegistered: e.offeringCode.includes('CS201') || e.offeringCode.includes('EE201') ? 4 : 3,
          tuitionStatus: 'Paid',
          advisorApproval: true,
          registrarApproval: true
        }
      });
    }
  }

  // 15. Seed Transport Module data
  console.log('Seeding Transport data...');
  const vehicleCount = await prisma.vehicle.count();
  if (vehicleCount === 0) {
    const v1 = await prisma.vehicle.create({
      data: {
        vehicleNumber: 'BUS-01',
        registrationNumber: 'TX-9988-ABC',
        vehicleType: 'Bus',
        manufacturer: 'Mercedes-Benz',
        model: 'Sprinter Transit',
        year: 2021,
        seatingCapacity: 40,
        fuelType: 'Diesel',
        insuranceExpiry: new Date('2027-01-01T00:00:00Z'),
        fitnessExpiry: new Date('2027-01-01T00:00:00Z'),
        status: 'Active',
      },
    });

    const v2 = await prisma.vehicle.create({
      data: {
        vehicleNumber: 'BUS-02',
        registrationNumber: 'TX-1122-XYZ',
        vehicleType: 'Mini Bus',
        manufacturer: 'Toyota',
        model: 'Coaster',
        year: 2022,
        seatingCapacity: 25,
        fuelType: 'Diesel',
        insuranceExpiry: new Date('2026-12-15T00:00:00Z'),
        fitnessExpiry: new Date('2026-12-15T00:00:00Z'),
        status: 'Active',
      },
    });

    const d1 = await prisma.driver.create({
      data: {
        fullName: 'Robert De Niro',
        phone: '+1-555-0701',
        email: 'robert.driver@university.edu',
        licenseNumber: 'DL-99881122',
        licenseExpiry: new Date('2030-05-12T00:00:00Z'),
        address: '55 Ocean Ave, Marina Bay',
        emergencyContact: 'Mrs. De Niro (+1-555-0702)',
        assignedVehicleId: v1.id,
        status: 'Active',
      },
    });

    const d2 = await prisma.driver.create({
      data: {
        fullName: 'Ryan Gosling',
        phone: '+1-555-0901',
        email: 'ryan.driver@university.edu',
        licenseNumber: 'DL-33445566',
        licenseExpiry: new Date('2028-11-20T00:00:00Z'),
        address: '102 Neon Blvd, Retro City',
        emergencyContact: 'Irene (+1-555-0902)',
        assignedVehicleId: v2.id,
        status: 'Active',
      },
    });

    const r1 = await prisma.transportRoute.create({
      data: {
        routeName: 'Metro-University Express',
        routeCode: 'R-METRO',
        startLocation: 'Central Metro Station',
        endLocation: 'University Main Gate',
        estimatedDistance: 12.5,
        estimatedTime: '30 mins',
        fare: 15.0,
        active: true,
      },
    });

    const r2 = await prisma.transportRoute.create({
      data: {
        routeName: 'North Suburbs Route',
        routeCode: 'R-NORTH',
        startLocation: 'North Green Plaza',
        endLocation: 'University Engineering Block',
        estimatedDistance: 18.2,
        estimatedTime: '45 mins',
        fare: 25.0,
        active: true,
      },
    });

    await prisma.transportStop.createMany({
      data: [
        { routeId: r1.id, stopName: 'Central Metro Station', latitude: 40.7128, longitude: -74.006, arrivalTime: '07:30 AM', departureTime: '07:35 AM', sequence: 1 },
        { routeId: r1.id, stopName: 'Broadway Avenue Junction', latitude: 40.725, longitude: -74.002, arrivalTime: '07:45 AM', departureTime: '07:47 AM', sequence: 2 },
        { routeId: r1.id, stopName: 'University Main Gate', latitude: 40.74, longitude: -73.99, arrivalTime: '08:00 AM', departureTime: '08:05 AM', sequence: 3 },

        { routeId: r2.id, stopName: 'North Green Plaza', latitude: 40.8, longitude: -74.05, arrivalTime: '07:15 AM', departureTime: '07:20 AM', sequence: 1 },
        { routeId: r2.id, stopName: 'Oakwood Shopping Center', latitude: 40.78, longitude: -74.02, arrivalTime: '07:35 AM', departureTime: '07:38 AM', sequence: 2 },
        { routeId: r2.id, stopName: 'University Engineering Block', latitude: 40.742, longitude: -73.992, arrivalTime: '08:00 AM', departureTime: '08:05 AM', sequence: 3 },
      ],
    });

    await prisma.vehicleFuelLog.create({
      data: {
        vehicleId: v1.id,
        fuelQuantity: 45.5,
        cost: 68.25,
        odometerReading: 12450.0,
        remarks: 'Weekly top up',
      },
    });

    await prisma.vehicleTrip.create({
      data: {
        vehicleId: v1.id,
        driverId: d1.id,
        routeId: r1.id,
        status: 'Completed',
        startOdometer: 12450.0,
        endOdometer: 12462.5,
        notes: 'Morning run completed on time',
      },
    });
  }

  // 16. Seed Parent User & Profile for John Doe
  console.log('Seeding Parent User & Profile for John Doe...');
  const parentEmail = 'parent@university.edu';
  let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
  if (!parentUser) {
    parentUser = await prisma.user.create({
      data: {
        email: parentEmail,
        password: hashedPassword,
        firstName: 'Richard',
        lastName: 'Doe',
        gender: Gender.MALE,
        status: 'ACTIVE',
        isEmailVerified: true,
        isActive: true,
        roleId: roleMap[UserRole.PARENT],
      },
    });
  }

  let parentProfile = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (!parentProfile) {
    parentProfile = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        relation: 'Father',
        occupation: 'Software Architect',
        status: 'ACTIVE',
      },
    });
  }

  // Update John Doe's profile with sectionId and parentId
  const johnDoeProfile = studentMap['student@university.edu'];
  if (johnDoeProfile) {
    await prisma.student.update({
      where: { id: johnDoeProfile.id },
      data: {
        sectionId: sectionMap['CS-A']?.id,
        parentId: parentProfile.id,
        fatherName: 'Richard Doe',
        motherName: 'Mary Doe',
        mobileNumber: '+1-555-0142',
        permanentAddress: '100 University Heights, Academic City',
        city: 'Academic City',
        country: 'USA',
        dateOfBirth: new Date('2003-05-15T00:00:00Z'),
      },
    });
  }

  // 17. Seed Buildings & Rooms
  console.log('Seeding Buildings & Rooms...');
  let mainBuilding = await prisma.building.findUnique({ where: { code: 'MAIN-BLK' } });
  if (!mainBuilding) {
    mainBuilding = await prisma.building.create({
      data: {
        name: 'Main Academic Building',
        code: 'MAIN-BLK',
        campus: 'Main Campus',
        address: '123 Campus Way',
        totalFloors: 4,
        totalRooms: 20,
        status: 'Active',
      },
    });
  }

  let room101 = await prisma.room.findFirst({
    where: { buildingId: mainBuilding.id, roomNumber: '101' },
  });
  if (!room101) {
    room101 = await prisma.room.create({
      data: {
        buildingId: mainBuilding.id,
        roomNumber: '101',
        roomType: 'Classroom',
        capacity: 60,
        floor: 1,
        status: 'Active',
        departmentId: departmentMap['CS']?.id,
      },
    });
  }

  let lab201 = await prisma.room.findFirst({
    where: { buildingId: mainBuilding.id, roomNumber: '201' },
  });
  if (!lab201) {
    lab201 = await prisma.room.create({
      data: {
        buildingId: mainBuilding.id,
        roomNumber: '201',
        roomType: 'Laboratory',
        capacity: 40,
        floor: 2,
        status: 'Active',
        departmentId: departmentMap['CS']?.id,
      },
    });
  }

  // 18. Seed TimeSlots
  console.log('Seeding TimeSlots...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slotTemplates = [
    { periodNumber: 1, startTime: '08:00', endTime: '09:30' },
    { periodNumber: 2, startTime: '09:45', endTime: '11:15' },
    { periodNumber: 3, startTime: '11:30', endTime: '13:00' },
    { periodNumber: 4, startTime: '14:00', endTime: '15:30' },
  ];

  const timeSlotMap: Record<string, any> = {};
  for (const day of days) {
    for (const slot of slotTemplates) {
      const key = `${day}_${slot.periodNumber}`;
      let ts = await prisma.timeSlot.findFirst({
        where: { dayOfWeek: day, periodNumber: slot.periodNumber },
      });
      if (!ts) {
        ts = await prisma.timeSlot.create({
          data: {
            dayOfWeek: day,
            periodNumber: slot.periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: 'Active',
          },
        });
      }
      timeSlotMap[key] = ts;
    }
  }

  // 19. Seed Timetable for CS-A
  console.log('Seeding Timetable entries...');
  const csSection = sectionMap['CS-A'];
  const teacherSarah = teacherMap['teacher@university.edu'];
  const offeringCS101 = offeringMap['CO-CS101'];
  const offeringCS201 = offeringMap['CO-CS201'];

  if (csSection && teacherSarah && offeringCS101 && offeringCS201 && room101 && lab201) {
    const timetableData = [
      { day: 'Monday', period: 1, offering: offeringCS101, subject: subjectMap['CS101-SUB'], room: room101 },
      { day: 'Monday', period: 2, offering: offeringCS201, subject: subjectMap['CS201-SUB'], room: lab201 },
      { day: 'Wednesday', period: 1, offering: offeringCS101, subject: subjectMap['CS101-SUB'], room: room101 },
      { day: 'Wednesday', period: 2, offering: offeringCS201, subject: subjectMap['CS201-SUB'], room: lab201 },
      { day: 'Friday', period: 1, offering: offeringCS101, subject: subjectMap['CS101-SUB'], room: room101 },
    ];

    for (const tt of timetableData) {
      const ts = timeSlotMap[`${tt.day}_${tt.period}`];
      if (ts) {
        const existingTT = await prisma.timetable.findFirst({
          where: {
            timeSlotId: ts.id,
            sectionId: csSection.id,
          },
        });

        if (!existingTT) {
          await prisma.timetable.create({
            data: {
              timeSlotId: ts.id,
              sectionId: csSection.id,
              courseOfferingId: tt.offering.id,
              teacherId: teacherSarah.id,
              subjectId: tt.subject.id,
              roomId: tt.room.id,
              academicYear: '2025-2026',
              session: 'Fall',
              effectiveFrom: new Date('2025-09-01T00:00:00Z'),
              effectiveTo: new Date('2026-01-31T00:00:00Z'),
              status: 'Active',
            },
          });
        }
      }
    }
  }

  // 20. Seed Attendance Sessions & Records for John Doe
  console.log('Seeding Attendance Sessions & Records...');
  if (johnDoeProfile && offeringCS101 && teacherSarah && csSection && room101) {
    const johnDoeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: johnDoeProfile.id,
        courseOfferingId: offeringCS101.id,
      },
    });

    if (johnDoeEnrollment) {
      const dates = [
        new Date('2025-09-08T08:00:00Z'),
        new Date('2025-09-10T08:00:00Z'),
        new Date('2025-09-12T08:00:00Z'),
        new Date('2025-09-15T08:00:00Z'),
      ];

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const session = await prisma.attendanceSession.create({
          data: {
            courseOfferingId: offeringCS101.id,
            teacherId: teacherSarah.id,
            sectionId: csSection.id,
            roomId: room101.id,
            attendanceDate: date,
            startTime: '08:00',
            endTime: '09:30',
            sessionStatus: 'Completed',
            attendanceMethod: 'Manual',
            notes: `Lecture ${i + 1}`,
          },
        });

        await prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: session.id,
            studentId: johnDoeProfile.id,
            enrollmentId: johnDoeEnrollment.id,
            attendanceStatus: i === 3 ? 'Late' : 'Present',
            arrivalTime: i === 3 ? '08:12' : '08:00',
            remarks: i === 3 ? 'Arrived 12 minutes late' : 'On time',
            markedBy: teacherSarah.designation,
          },
        });
      }
    }
  }

  // 21. Seed Assignments & Submissions for John Doe
  console.log('Seeding Assignments & Submissions...');
  if (johnDoeProfile && offeringCS101 && teacherSarah) {
    const johnDoeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: johnDoeProfile.id,
        courseOfferingId: offeringCS101.id,
      },
    });

    if (johnDoeEnrollment) {
      const existingAssignment = await prisma.assignment.findUnique({
        where: { assignmentCode: 'ASG-CS101-01' },
      });

      let assignment = existingAssignment;
      if (!assignment) {
        assignment = await prisma.assignment.create({
          data: {
            assignmentCode: 'ASG-CS101-01',
            title: 'Programming Assignment 1: Basic Control Flow',
            description: 'Implement core algorithmic logic using loops, functions, and structured error handling in C++ / Python.',
            instructions: 'Submit code file and PDF report before deadline.',
            courseOfferingId: offeringCS101.id,
            teacherId: teacherSarah.id,
            totalMarks: 100,
            passingMarks: 50,
            assignmentType: 'Homework',
            publishDate: new Date('2025-09-05T00:00:00Z'),
            dueDate: new Date('2025-09-20T23:59:59Z'),
            visibilityStatus: 'Published',
          },
        });
      }

      const existingSubmission = await prisma.assignmentSubmission.findFirst({
        where: { studentId: johnDoeProfile.id, assignmentId: assignment.id },
      });

      if (!existingSubmission) {
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: johnDoeProfile.id,
            enrollmentId: johnDoeEnrollment.id,
            submissionNumber: 1,
            submittedAt: new Date('2025-09-18T14:30:00Z'),
            submissionStatus: 'Graded',
            obtainedMarks: 95,
            percentage: 95.0,
            grade: 'A',
            feedback: 'Excellent work! Clean code structure and complete test coverage.',
            teacherRemarks: 'Top scorer in class.',
            gradedAt: new Date('2025-09-22T10:00:00Z'),
          },
        });
      }
    }
  }

  // 22. Seed Results for John Doe
  console.log('Seeding Academic Results for John Doe...');
  if (johnDoeProfile && offeringCS101 && semesterMap['FALL2025-CS']) {
    const johnDoeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: johnDoeProfile.id,
        courseOfferingId: offeringCS101.id,
      },
    });

    if (johnDoeEnrollment) {
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: johnDoeProfile.id,
          courseOfferingId: offeringCS101.id,
        },
      });

      if (!existingResult) {
        await prisma.result.create({
          data: {
            studentId: johnDoeProfile.id,
            enrollmentId: johnDoeEnrollment.id,
            courseOfferingId: offeringCS101.id,
            semesterId: semesterMap['FALL2025-CS'].id,
            academicYear: '2025-2026',
            session: 'Fall',
            assignmentMarks: 20,
            quizMarks: 15,
            midtermMarks: 28,
            finalExamMarks: 32,
            totalObtainedMarks: 95,
            totalMarks: 100,
            percentage: 95.0,
            grade: 'A',
            gradePoint: 4.0,
            creditHours: 3.0,
            qualityPoints: 12.0,
            passStatus: 'Pass',
            approvalStatus: 'Published',
            remarks: 'Outstanding performance',
          },
        });
      }
    }
  }

  console.log('Database seeding successfully completed with robust demo structures!');
  console.log('Credentials seeded:');
  console.log('1. Admin   - Email: admin@university.edu   / Password: Password@123');
  console.log('2. Teacher - Email: teacher@university.edu / Password: Password@123');
  console.log('3. Student - Email: student@university.edu / Password: Password@123 (John Doe)');
  console.log('4. Parent  - Email: parent@university.edu  / Password: Password@123 (Richard Doe - John Doe\'s Father)');
  console.log('5. BSEE Student - Email: peter.parker@university.edu / Password: Password@123');
  console.log('6. MBA Student  - Email: bruce.wayne@university.edu  / Password: Password@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding failed with error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
