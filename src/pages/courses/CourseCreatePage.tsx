import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { AlertCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';

export const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Interface State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Course Name and Course Code are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.post('/courses', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        credits,
        description: description.trim() || undefined,
        status,
      });

      if (response.status === 201 || response.data?.status === 'success') {
        navigate(ROUTES.COURSES || '/courses');
      } else {
        throw new Error('Course creation failed.');
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
      title="Create Course"
      description="Define a new academic course catalog record for university programs."
    >
      <div className="max-w-3xl mx-auto space-y-6">
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

        {/* Error Notice */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Main Creation Card */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-mono uppercase text-gray-500 tracking-wider mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Programming"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 tracking-wider mb-2">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS101"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <p className="text-xxs text-gray-400 mt-1.5 font-mono">
                  Alphanumeric, alphanumeric-dashed characters only.
                </p>
              </div>

              {/* Credits */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 tracking-wider mb-2">
                  Credits Value <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={credits}
                  onChange={(e) => setCredits(parseInt(e.target.value, 10))}
                >
                  <option value={1}>1 Credit</option>
                  <option value={2}>2 Credits</option>
                  <option value={3}>3 Credits</option>
                  <option value={4}>4 Credits</option>
                  <option value={5}>5 Credits</option>
                  <option value={6}>6 Credits</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 tracking-wider mb-2">
                  Initial Status
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      className="text-primary focus:ring-primary h-4 w-4"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                    />
                    <span>Active Catalog</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      className="text-primary focus:ring-primary h-4 w-4"
                      checked={status === 'INACTIVE'}
                      onChange={() => setStatus('INACTIVE')}
                    />
                    <span>Draft / Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 tracking-wider mb-2">
                Course Syllabus Summary & Detailed Syllabus Notes
              </label>
              <textarea
                rows={4}
                placeholder="Outline general course overview, core syllabus benchmarks, reference materials, or prerequisites..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <Link to={ROUTES.COURSES || '/courses'}>
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                leftIcon={saving ? RefreshCw : Check}
                className={saving ? 'animate-pulse' : ''}
              >
                {saving ? 'Creating Course...' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
