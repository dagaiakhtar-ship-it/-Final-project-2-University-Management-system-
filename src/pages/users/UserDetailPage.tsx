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
  User,
  Mail,
  Shield,
  Calendar,
} from 'lucide-react';

interface UserDetail {
  id: number;
  uuid: string;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
  };
}

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/users/${id}`);
      if (response.data?.status === 'success') {
        setUser(response.data.data);
      } else {
        throw new Error('User details could not be retrieved.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while loading the user.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to deactivate or remove this user account?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/users/${user.uuid}`);
      if (response.status === 200 || response.data?.status === 'success') {
        navigate(ROUTES.USERS || '/users');
      } else {
        throw new Error('Delete operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <PageContainer title="User Profile">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-gray-500">Loading user account record...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer title="User Profile">
        <div className="max-w-2xl mx-auto space-y-6 mt-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error || 'User not found.'}</p>
          </div>
          <Link
            to={ROUTES.USERS || '/users'}
            className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to users directory</span>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${user.firstName} ${user.lastName}`}
      description={`User Account Record - ${user.email}`}
      action={
        isSuperAdmin && (
          <div className="flex items-center space-x-2">
            <Link to={`/users/${user.uuid}/edit`}>
              <Button variant="outline" leftIcon={Edit2}>
                Edit User
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
            to={ROUTES.USERS || '/users'}
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Link>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center space-x-4 pb-6 border-b">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-2xl font-mono">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm font-mono text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Role Authorization:</span>
                <span className="font-bold font-mono px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                  {user.role?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Account Status:</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Gender:</span>
                <span className="font-medium text-gray-900">{user.gender}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Last Login:</span>
                <span className="font-mono text-xs text-gray-700">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Created On:</span>
                <span className="font-mono text-xs text-gray-700">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-mono">Last Updated:</span>
                <span className="font-mono text-xs text-gray-700">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
