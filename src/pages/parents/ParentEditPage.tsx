import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { AlertCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';

export const ParentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [relation, setRelation] = useState('Father');
  const [occupation, setOccupation] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/parents/${id}`);
      if (response.data?.status === 'success') {
        const p = response.data.data;
        setRelation(p.relation || 'Father');
        setOccupation(p.occupation || '');
        setStatus(p.status || 'ACTIVE');
      } else {
        throw new Error('Parent details could not be loaded.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while fetching parent profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParent();
  }, [fetchParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !relation.trim()) {
      setError('Relation field is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.put(`/parents/${id}`, {
        relation: relation.trim(),
        occupation: occupation.trim() || undefined,
        status,
      });

      if (response.status === 200 || response.data?.status === 'success') {
        navigate(ROUTES.PARENTS || '/parents');
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
      <PageContainer title="Edit Parent Profile">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-gray-500">Loading parent record...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Parent Profile"
      description="Update parent guardian details, relation classification, and status."
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
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Status</label>
              <select
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link to={ROUTES.PARENTS || '/parents'}>
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
