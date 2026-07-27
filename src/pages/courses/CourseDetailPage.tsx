import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  User,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Subject {
  id: number;
  uuid: string;
  name: string;
  code: string;
  creditHours: number;
  department?: {
    name: string;
  };
  program?: {
    name: string;
  };
  teacher?: {
    employeeId: string;
    designation: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface Course {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  subjects?: Subject[];
}

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Course
  const fetchCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/courses/${id}`);
      if (response.data?.status === 'success') {
        setCourse(response.data.data);
      } else {
        throw new Error('Course details could not be retrieved.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while loading the course.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Delete handler
  const handleDelete = async () => {
    if (!course) return;
    if (!window.confirm('Are you sure you want to delete this course record? This action is reversible if backed up.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/courses/${course.uuid}`);
      if (response.status === 200 || response.data?.status === 'success') {
        navigate(ROUTES.COURSES || '/courses');
      } else {
        throw new Error('Delete operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <PageContainer title="Course Details">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-gray-500">Retrieving course record...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !course) {
    return (
      <PageContainer title="Course Details">
        <div className="max-w-2xl mx-auto space-y-6 mt-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error || 'Course not found.'}</p>
          </div>
          <Link
            to={ROUTES.COURSES || '/courses'}
            className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to courses directory</span>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={course.code}
      description={course.name}
      action={
        isWritable && (
          <div className="flex items-center space-x-2">
            <Link to={`/courses/${course.uuid}/edit`}>
              <Button variant="outline" leftIcon={Edit2}>
                Edit Course
              </Button>
            </Link>
            <Button variant="danger" leftIcon={Trash2} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to={ROUTES.COURSES || '/courses'}
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Link>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Specs Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="text-sm font-mono uppercase text-gray-500 tracking-wider pb-3 border-b border-gray-100">
                Course Specifications
              </h3>

              {/* Status Badge */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-mono">Catalog Status:</span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    course.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      : 'bg-red-50 text-red-800 border-red-100'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      course.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span>{course.status}</span>
                </span>
              </div>

              {/* Credits */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-mono">Credits Value:</span>
                <span className="font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-mono border border-amber-100">
                  {course.credits} Credits
                </span>
              </div>

              {/* Created At */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-mono">Created On:</span>
                <span className="text-gray-700 font-mono">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Last Updated */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-mono">Last Modified:</span>
                <span className="text-gray-700 font-mono">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          </div>

          {/* Details & Subjects Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Summary */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-500 tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Syllabus Summary</span>
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                {course.description || 'No syllabus outline or course overview notes exist for this catalog record yet.'}
              </p>
            </Card>

            {/* Subject Mappings */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-500 tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
                <Layers className="h-4 w-4 text-amber-500" />
                <span>Linked Curriculum Subjects ({course.subjects?.length || 0})</span>
              </h3>

              {!course.subjects || course.subjects.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-mono">
                    No curriculum subject associations linked to this course yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.subjects.map((subj) => (
                    <div
                      key={subj.uuid}
                      className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition duration-150 bg-gray-50/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {subj.code}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900">{subj.name}</h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 font-sans">
                            {subj.department && (
                              <div className="flex items-center space-x-1">
                                <Layers className="h-3.5 w-3.5 text-gray-400" />
                                <span>Dept: {subj.department.name}</span>
                              </div>
                            )}
                            {subj.program && (
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                <span>Prog: {subj.program.name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>{subj.creditHours} Hours</span>
                            </div>
                          </div>
                        </div>

                        {subj.teacher && (
                          <div className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-gray-100 self-start sm:self-auto">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">
                                {subj.teacher.user.firstName} {subj.teacher.user.lastName}
                              </div>
                              <p className="text-xxs text-gray-400 font-mono leading-none mt-0.5">
                                {subj.teacher.designation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
