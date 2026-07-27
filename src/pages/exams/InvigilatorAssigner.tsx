import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import { UserCheck, Trash2, Plus, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Exam, Teacher, ExamInvigilator } from './types';

interface InvigilatorAssignerProps {
  exam: Exam;
  onRefresh: () => void;
}

export const InvigilatorAssigner: React.FC<InvigilatorAssignerProps> = ({ exam, onRefresh }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New assignment state
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignedRole, setAssignedRole] = useState('Invigilator');

  // List of active assignments in local state
  const [assignments, setAssignments] = useState<{ teacherId: number; role: string }[]>([]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/teachers');
        if (res.data?.success) {
          setTeachers(res.data.data || []);
        } else if (Array.isArray(res.data)) {
          setTeachers(res.data);
        }
      } catch (err) {
        toast.error('Failed to load instructor listings.');
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();

    // Map existing invigilators from exam
    if (exam.invigilators) {
      setAssignments(
        exam.invigilators.map((inv) => ({
          teacherId: inv.teacherId,
          role: inv.role,
        }))
      );
    }
  }, [exam]);

  const handleAddAssignment = () => {
    if (!selectedTeacherId) {
      toast.error('Please select an instructor.');
      return;
    }

    const tId = Number(selectedTeacherId);
    if (assignments.some((a) => a.teacherId === tId)) {
      toast.error('Instructor is already added to this exam invigilation list.');
      return;
    }

    // In a university system, the Examiner itself should not be the invigilator unless chiefs
    if (exam.teacherId === tId && assignedRole !== 'Chief Invigilator') {
      toast.error('Note: This instructor is the Examiner/Author of this exam paper.');
    }

    setAssignments([...assignments, { teacherId: tId, role: assignedRole }]);
    setSelectedTeacherId('');
  };

  const handleRemoveAssignment = (teacherId: number) => {
    setAssignments(assignments.filter((a) => a.teacherId !== teacherId));
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const res = await apiClient.post(`/exams/${exam.id}/assign-invigilators`, {
        invigilators: assignments,
      });
      toast.success(res.data?.message || 'Invigilators assigned successfully.');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Scheduling conflict detected.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="invigilator-assigner-view">
      {/* 1. Add Assignment Form */}
      <Card className="p-6 bg-white border border-slate-100 col-span-1 h-fit" id="invigilator-add-card">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-indigo-500" /> Allocate Staff
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Instructor</label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Choose Instructor --</option>
              {teachers.map((t) => {
                const name = t.user ? `${t.user.firstName} ${t.user.lastName}` : `Teacher #${t.id}`;
                return (
                  <option key={t.id} value={t.id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duty Role</label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
            >
              <option value="Chief Invigilator">Chief Invigilator (Hall Head)</option>
              <option value="Invigilator">Standard Invigilator</option>
              <option value="Hall Assistant">Hall Assistant</option>
              <option value="Relief Officer">Relief Support Officer</option>
            </select>
          </div>

          <Button onClick={handleAddAssignment} variant="outline" className="w-full text-xs font-bold py-2 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 border-indigo-200/50 mt-2">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add to List
          </Button>
        </div>
      </Card>

      {/* 2. Active Invigilators List */}
      <Card className="p-6 bg-white border border-slate-100 col-span-2 flex flex-col justify-between min-h-80" id="invigilator-list-card">
        <div>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Duty Roster</h3>
            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">
              {assignments.length} Officers Assigned
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-700 uppercase">Duty Roster Clear</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">No invigilators or chief examiners have been assigned to supervise this hall session.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
              {assignments.map((assignment) => {
                const teacherObj = teachers.find((t) => t.id === assignment.teacherId);
                const name = teacherObj?.user
                  ? `${teacherObj.user.firstName} ${teacherObj.user.lastName}`
                  : `Instructor ID #${assignment.teacherId}`;
                const email = teacherObj?.user?.email || 'N/A';

                return (
                  <div key={assignment.teacherId} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 block">{name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{email}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm uppercase">
                        {assignment.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(assignment.teacherId)}
                        className="text-slate-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Save Button */}
        {assignments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
            <Button onClick={handleSaveAssignments} variant="primary" disabled={saving} size="sm">
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Verifying Schedules...
                </span>
              ) : (
                'Save Assignment Duty Roster'
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
