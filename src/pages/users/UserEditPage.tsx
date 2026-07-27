import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { AlertCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState<string>('STUDENT');
  const [status, setStatus] = useState<string>('ACTIVE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/users/${id}`);
      if (response.data?.status === 'success') {
        const u = response.data.data;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setRoleName(u.role?.name || 'STUDENT');
        setStatus(u.status || 'ACTIVE');
      } else {
        throw new Error('User details could not be loaded.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while fetching user.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name, and email are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.put(`/users/${id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        roleName,
        status,
      });

      if (response.status === 200 || response.data?.status === 'success') {
        navigate(ROUTES.USERS || '/users');
      } else {
        throw new Error('Update operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred during save.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Edit User">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-gray-500">Loading user record for modification...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit User"
      description="Update identity details or modify authorization roles."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to={ROUTES.USERS || '/users'}
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">System Role *</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Account Status</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link to={ROUTES.USERS || '/users'}>
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={saving} leftIcon={saving ? RefreshCw : Check}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
