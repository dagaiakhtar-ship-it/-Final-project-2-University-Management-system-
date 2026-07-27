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
  Users,
  GraduationCap,
  Briefcase,
  Heart,
} from 'lucide-react';

interface ParentDetail {
  id: number;
  uuid: string;
  relation: string;
  occupation: string | null;
  status: string;
  createdAt: string;
  user: {
    id: number;
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  students: Array<{
    id: number;
    uuid: string;
    registrationNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    department?: {
      name: string;
      code: string;
    };
  }>;
}

export const ParentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [parent, setParent] = useState<ParentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/parents/${id}`);
      if (response.data?.status === 'success') {
        setParent(response.data.data);
      } else {
        throw new Error('Parent record details could not be retrieved.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred loading parent details.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParent();
  }, [fetchParent]);

  const handleDelete = async () => {
    if (!parent) return;
    if (!window.confirm('Are you sure you want to remove this parent record?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/parents/${parent.uuid}`);
      if (response.status === 200 || response.data?.status === 'success') {
        navigate(ROUTES.PARENTS || '/parents');
      } else {
        throw new Error('Delete operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to delete parent record');
    }
  };

  if (loading) {
    return (
      <PageContainer title="Parent Profile">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-gray-500">Loading parent guardian record...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !parent) {
    return (
      <PageContainer title="Parent Profile">
        <div className="max-w-2xl mx-auto space-y-6 mt-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error || 'Parent record not found.'}</p>
          </div>
          <Link
            to={ROUTES.PARENTS || '/parents'}
            className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to parents directory</span>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${parent.user?.firstName} ${parent.user?.lastName}`}
      description={`Parent Profile - ${parent.relation}`}
      action={
        isAdmin && (
          <div className="flex items-center space-x-2">
            <Link to={`/parents/${parent.uuid}/edit`}>
              <Button variant="outline" leftIcon={Edit2}>
                Edit Profile
              </Button>
            </Link>
            <Button variant="danger" leftIcon={Trash2} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link
            to={ROUTES.PARENTS || '/parents'}
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Parents</span>
          </Link>
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Email Address:</span>
                <span className="font-mono text-xs font-semibold">{parent.user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Relation:</span>
                <span className="font-medium text-gray-900">{parent.relation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Occupation:</span>
                <span className="font-medium text-gray-900">{parent.occupation || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Status:</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                  {parent.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Registered Date:</span>
                <span className="font-mono text-xs text-gray-700">
                  {new Date(parent.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>Associated Student Wards ({parent.students?.length || 0})</span>
            </h3>

            {parent.students && parent.students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parent.students.map((st) => (
                  <div key={st.uuid} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {st.user?.firstName} {st.user?.lastName}
                      </h4>
                      <p className="text-xs font-mono text-gray-500">
                        Reg No: {st.registrationNumber} | Dept: {st.department?.code || 'N/A'}
                      </p>
                    </div>
                    <Link to={`/students/${st.uuid}`}>
                      <Button variant="outline" size="sm">
                        View Ward
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No student wards linked to this parent profile yet.</p>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
