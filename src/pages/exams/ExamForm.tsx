import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Clock, Calendar, Check, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { Exam } from './types';

interface ExamFormProps {
  examId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ExamForm: React.FC<ExamFormProps> = ({ examId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    examType: 'Midterm',
    courseOfferingId: '',
    totalMarks: '100',
    passingMarks: '40',
    durationMinutes: '120',
    examDate: '',
    startTime: '09:00',
    endTime: '11:00',
    roomId: '',
    instructions: '',
    session: 'Fall',
    academicYear: '2026-2027',
  });

  // Load supporting lists
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offeringsRes, roomsRes, buildingsRes] = await Promise.all([
          apiClient.get('/course-offerings'),
          apiClient.get('/rooms'),
          apiClient.get('/buildings'),
        ]);

        if (offeringsRes.data?.success) {
          setOfferings(offeringsRes.data.data || []);
        } else if (Array.isArray(offeringsRes.data)) {
          setOfferings(offeringsRes.data);
        }

        if (roomsRes.data?.success) {
          setRooms(roomsRes.data.data || []);
        } else if (Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        if (buildingsRes.data?.success) {
          setBuildings(buildingsRes.data.data || []);
        } else if (Array.isArray(buildingsRes.data)) {
          setBuildings(buildingsRes.data);
        }

        // If editing, load original exam data
        if (examId) {
          setLoading(true);
          const examRes = await apiClient.get(`/exams/${examId}`);
          const exam: Exam = examRes.data;
          
          setFormData({
            title: exam.title,
            examType: exam.examType,
            courseOfferingId: String(exam.courseOfferingId),
            totalMarks: String(exam.totalMarks),
            passingMarks: String(exam.passingMarks),
            durationMinutes: String(exam.durationMinutes),
            examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
            startTime: exam.startTime || '09:00',
            endTime: exam.endTime || '11:00',
            roomId: exam.roomId ? String(exam.roomId) : '',
            instructions: exam.instructions || '',
            session: exam.session || 'Fall',
            academicYear: exam.academicYear || '2026',
          });
        }
      } catch (err: any) {
        toast.error('Failed to load form prerequisites.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  // Run live validation / conflict detection
  const performLiveConflictCheck = async () => {
    const { courseOfferingId, examDate, startTime, endTime, roomId, examType } = formData;
    if (!courseOfferingId || !examDate || !startTime || !endTime) {
      return;
    }

    try {
      setValidating(true);
      const selectedOffering = offerings.find((o) => o.id === Number(courseOfferingId));
      if (!selectedOffering) return;

      const payload = {
        id: examId || undefined,
        courseOfferingId: Number(courseOfferingId),
        teacherId: selectedOffering.teacherId,
        examDate,
        startTime,
        endTime,
        roomId: roomId ? Number(roomId) : undefined,
        examType,
        subjectId: selectedOffering.subjectId,
      };

      // We call the validation routine via a dry-run update check or via creating a small test
      // In our design, the API returns conflict details when validation is run
      // Let's call the endpoint or query to detect conflicts.
      // Wait, we can post a mock check to check conflicts! 
      // Wait! Does our backend have a dedicated validation endpoint or we can use our service's validator?
      // Since our service validator is called in create/update, we can implement an API endpoint for it, OR we can let the controller return the message if we try to submit, OR we can simulate/trigger a dry-run update.
      // Wait, since we threw errors on conflict, trying to create/update will return conflicts in `{ error: "Scheduling conflict(s) detected..." }`. We can catch this error on save and display the conflicts beautifully in the UI!
      // But we can also query existing exams on the same day in our frontend to provide a nice immediate preview of overlapping schedules. Let's do that!
      const params = { examDate };
      const res = await apiClient.get('/exams', { params });
      const examsOnDay = res.data?.exams || res.data || [];
      
      const foundConflicts: string[] = [];
      const selectedRoomId = roomId ? Number(roomId) : null;
      const selectedTeacherId = selectedOffering.teacherId;

      // Simple overlaps checks
      const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string) => {
        const [hAStart, mAStart] = startA.split(':').map(Number);
        const [hAEnd, mAEnd] = endA.split(':').map(Number);
        const [hBStart, mBStart] = startB.split(':').map(Number);
        const [hBEnd, mBEnd] = endB.split(':').map(Number);
        return Math.max(hAStart * 60 + mAStart, hBStart * 60 + mBStart) < Math.min(hAEnd * 60 + mAEnd, hBEnd * 60 + mBEnd);
      };

      examsOnDay.forEach((other: any) => {
        if (examId && other.id === examId) return;
        if (other.status === 'Cancelled') return;

        if (isTimeOverlapping(startTime, endTime, other.startTime, other.endTime)) {
          if (selectedRoomId && other.roomId === selectedRoomId) {
            foundConflicts.push(`Room overlap: Room ${other.room?.roomNumber || other.roomId} is already booked for "${other.title}".`);
          }
          if (other.teacherId === selectedTeacherId) {
            foundConflicts.push(`Teacher overlap: Instructor is teaching/examining for "${other.title}".`);
          }
          // Student groups
          if (other.courseOfferingId === Number(courseOfferingId)) {
            foundConflicts.push(`Schedule overlap: An exam "${other.title}" is already scheduled for this same class offering at this time.`);
          }
        }
      });

      // Capacity Check
      if (selectedRoomId) {
        const room = rooms.find((r) => r.id === selectedRoomId);
        const enrollmentCount = selectedOffering.enrollments?.length || selectedOffering._count?.enrollments || 0;
        if (room && room.capacity < enrollmentCount) {
          foundConflicts.push(`Room Capacity Warning: Room capacity is ${room.capacity}, but course enrollment is ${enrollmentCount} students.`);
        }
      }

      setConflicts(foundConflicts);
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  // Run live validation whenever schedules change
  useEffect(() => {
    performLiveConflictCheck();
  }, [formData.courseOfferingId, formData.examDate, formData.startTime, formData.endTime, formData.roomId, formData.examType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseOfferingId) {
      toast.error('Please select a Course Offering.');
      return;
    }

    try {
      setLoading(true);
      const selectedOffering = offerings.find((o) => o.id === Number(formData.courseOfferingId));
      if (!selectedOffering) return;

      const payload = {
        title: formData.title,
        examType: formData.examType,
        courseOfferingId: Number(formData.courseOfferingId),
        subjectId: selectedOffering.subjectId,
        teacherId: selectedOffering.teacherId,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        durationMinutes: Number(formData.durationMinutes),
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomId: formData.roomId ? Number(formData.roomId) : undefined,
        buildingId: formData.roomId ? rooms.find((r) => r.id === Number(formData.roomId))?.buildingId : undefined,
        session: formData.session,
        academicYear: formData.academicYear,
        instructions: formData.instructions,
      };

      if (examId) {
        await apiClient.put(`/exams/${examId}`, payload);
        toast.success('Exam schedule updated successfully.');
      } else {
        await apiClient.post('/exams', payload);
        toast.success('Exam scheduled successfully.');
      }
      onSuccess();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'An error occurred while saving the exam.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6 md:p-8" id="exam-scheduling-form-card">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{examId ? 'Edit Exam Schedule' : 'Schedule New Exam'}</h2>
          <p className="text-xs text-slate-500 mt-1">LMS-Integrated conflict validation is computed automatically.</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-800" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Exam Title *</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              placeholder="e.g. Midterm Theory Examination"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Assessment Type *</label>
            <select
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
            >
              <option value="Midterm">Midterm Examination</option>
              <option value="Final">Final Term Examination</option>
              <option value="Practical">Practical Session</option>
              <option value="Viva">Viva Voces Oral</option>
              <option value="Makeup">Makeup Examination</option>
              <option value="Retake">Retake Examination</option>
            </select>
          </div>

          {/* Course Offering */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Course Offering (Class Enrollment Group) *</label>
            <select
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.courseOfferingId}
              onChange={(e) => setFormData({ ...formData, courseOfferingId: e.target.value })}
            >
              <option value="">-- Choose Class Offering / Subject --</option>
              {offerings.map((o) => {
                const subjCode = o.subject?.code || 'SUBJ';
                const subjName = o.subject?.name || 'Unknown';
                const secName = o.section?.name || 'A';
                const semName = o.semester?.name || 'Semester';
                const instructorName = o.teacher?.user ? `${o.teacher.user.firstName} ${o.teacher.user.lastName}` : 'No teacher';
                const enrollmentsCount = o.enrollments?.length || o._count?.enrollments || 0;
                return (
                  <option key={o.id} value={o.id}>
                    {subjCode} - {subjName} | Sec {secName} | {semName} | ({instructorName}) | {enrollmentsCount} Students Enrolled
                  </option>
                );
              })}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Academic Year *</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="e.g. 2026-2027"
            />
          </div>

          {/* Session */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Academic Session *</label>
            <select
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.session}
              onChange={(e) => setFormData({ ...formData, session: e.target.value })}
            >
              <option value="Fall">Fall Semester</option>
              <option value="Spring">Spring Semester</option>
              <option value="Summer">Summer Term</option>
              <option value="Winter">Winter Session</option>
            </select>
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Examination Date *</label>
            <input
              type="date"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Duration (Minutes) *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Start Time *</label>
            <input
              type="time"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">End Time *</label>
            <input
              type="time"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          {/* Total Marks */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Total Marks *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
            />
          </div>

          {/* Passing Marks */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Passing Marks *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.passingMarks}
              onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
            />
          </div>

          {/* Allocated Room */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Allocated Classroom / Hall</label>
            <select
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            >
              <option value="">-- No Room Allocated (Keep Draft) --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.building?.name || 'Building'} - Room {r.roomNumber} (Capacity: {r.capacity})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">If no room is allocated, the exam remains in Draft mode.</p>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Special Guidelines & Instructions</label>
          <textarea
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-xs h-28 resize-none"
            placeholder="e.g. Bring own scientific calculators. Mobile phones are strictly prohibited."
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          />
        </div>

        {/* Automatic Conflict Warning Box */}
        {validating ? (
          <div className="flex items-center gap-2 p-3.5 bg-slate-55 border border-slate-100 rounded-xl text-xs text-slate-500 animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
            <span>Scanning class offerings, teacher logs, and physical room schedules for potential overlaps...</span>
          </div>
        ) : conflicts.length > 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-grow space-y-1">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wide">Scheduling Conflicts Detected</span>
              <ul className="list-disc pl-4 space-y-1">
                {conflicts.map((conflict, i) => (
                  <li key={i} className="text-xs text-amber-700 font-medium">{conflict}</li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Saving with these settings might fail due to database scheduler integrity rules.</p>
            </div>
          </div>
        ) : formData.courseOfferingId && formData.examDate && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Schedule clear: No overlapping student, teacher, or physical hall conflicts detected!</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Scheduling...' : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {examId ? 'Update Schedule' : 'Confirm & Schedule'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
