import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { AlertCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';

interface UserOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const ParentCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [relation, setRelation] = useState('Father');
  const [occupation, setOccupation] = useState('');

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEligibleUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await apiClient.get('/users', {
        params: { role: 'PARENT', limit: 50 },
      });
      if (response.data?.status === 'success') {
        setUsers(response.data.data.users);
        if (response.data.data.users.length > 0) {
          setSelectedUserId(response.data.data.users[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not fetch user accounts to link.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchEligibleUsers();
  }, [fetchEligibleUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !relation.trim()) {
      setError('User selection and relation are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.post('/parents', {
        userId: Number(selectedUserId),
        relation: relation.trim(),
        occupation: occupation.trim() || undefined,
      });

      if (response.status === 201 || response.data?.status === 'success') {
        navigate(ROUTES.PARENTS || '/parents');
      } else {
        throw new Error('Parent registration failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred during submission.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Create Parent Profile"
      description="Register a parent/guardian record associated with a parent user identity."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to={ROUTES.PARENTS || '/parents'}
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Parents</span>
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
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-2">
                Select User Account (Parent Role) *
              </label>
              {loadingUsers ? (
                <div className="py-2 text-xs text-gray-400 font-mono">Loading user accounts...</div>
              ) : (
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                >
                  {users.length === 0 ? (
                    <option value="">No unlinked PARENT users found</option>
                  ) : (
                    users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Relation *</label>
              <select
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Relative">Relative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Occupation</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link to={ROUTES.PARENTS || '/parents'}>
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={saving || !selectedUserId} leftIcon={saving ? RefreshCw : Check}>
                {saving ? 'Creating...' : 'Create Record'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
