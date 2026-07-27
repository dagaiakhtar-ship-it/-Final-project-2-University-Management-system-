import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Shield,
  Building,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Teacher {
  id: number;
  designation: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Department {
  id: number;
  uuid: string;
  name: string;
  code: string;
  shortName: string | null;
  description: string | null;
  faculty: string | null;
  officeLocation: string | null;
  officePhone: string | null;
  officeEmail: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  headOfDepartment: Teacher | null;
}

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isWritable = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [dept, setDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/departments/${id}`);
      if (response.data?.status === 'success') {
        setDept(response.data.data);
      } else {
        throw new Error('Failed to retrieve department details');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while loading department details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    try {
      const response = await apiClient.delete(`/departments/${dept?.uuid}`);
      if (response.data?.status === 'success') {
        navigate(ROUTES.DEPARTMENTS);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleToggleStatus = async () => {
    if (!dept) return;
    const nextStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await apiClient.patch(`/departments/${dept.uuid}/status`, { status: nextStatus });
      if (response.data?.status === 'success') {
        setDept({ ...dept, status: nextStatus });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update department status');
    }
  };

  return (
    <PageContainer
      title={dept ? dept.name : 'Department Details'}
      description={dept ? `Department Identification: ${dept.code}` : 'View secure department records.'}
      action={
        <div className="flex items-center gap-2">
          <Link to={ROUTES.DEPARTMENTS}>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>
          </Link>
          {dept && isWritable && (
            <>
              <Link to={`${ROUTES.DEPARTMENTS}/${dept.uuid}/edit`}>
                <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                  <Edit2 className="h-4 w-4 text-slate-600" /> Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="max-w-4xl mx-auto" id="department-details-container">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-semibold text-sm">Loading Error</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDetails}
              className="border-red-300 text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {loading ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Fetching secure department records from Cloud SQL...</p>
          </Card>
        ) : dept ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Quick Cards */}
            <div className="col-span-1 flex flex-col gap-6">
              {/* Profile Card */}
              <Card className="text-center p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-700">
                    <Building className="h-12 w-12" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{dept.name}</h3>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mx-auto mt-1">
                      {dept.code}
                    </span>
                  </div>

                  <div className="w-full border-t border-slate-100 my-2" />

                  <div className="w-full flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Status:</span>
                    {dept.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        <XCircle className="h-2.5 w-2.5" /> Inactive
                      </span>
                    )}
                  </div>

                  {isWritable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                      className="w-full mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Toggle Operational Status
                    </Button>
                  )}
                </div>
              </Card>

              {/* Administrative Contacts */}
              <Card title="Operational Contacts" className="border border-slate-200 shadow-xs">
                <div className="flex flex-col gap-4 text-xs">
                  {/* Office location */}
                  <div className="flex gap-3">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700">Office Location</p>
                      <p className="text-slate-500 mt-0.5">{dept.officeLocation || 'Not Assigned'}</p>
                    </div>
                  </div>

                  {/* Office phone */}
                  <div className="flex gap-3">
                    <Phone className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700">Office Phone</p>
                      <p className="text-slate-500 mt-0.5">{dept.officePhone || 'Not Assigned'}</p>
                    </div>
                  </div>

                  {/* Office email */}
                  <div className="flex gap-3">
                    <Mail className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700">Office Email</p>
                      {dept.officeEmail ? (
                        <a
                          href={`mailto:${dept.officeEmail}`}
                          className="text-emerald-600 hover:underline mt-0.5 block"
                        >
                          {dept.officeEmail}
                        </a>
                      ) : (
                        <p className="text-slate-500 mt-0.5">Not Assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Detailed info tabs/sections */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
              {/* Profile details */}
              <Card title="Overview & Objectives" className="border border-slate-200 shadow-xs">
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mission Statement / Description</h4>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                      {dept.description || 'No description or mission statement has been recorded for this department.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <h5 className="text-2xs font-bold text-slate-400 uppercase">Faculty / School</h5>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {dept.faculty || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-2xs font-bold text-slate-400 uppercase">Short Name / Abbreviation</h5>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {dept.shortName || dept.code}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Head of Department info */}
              <Card title="Academic Leadership" className="border border-slate-200 shadow-xs">
                {dept.headOfDepartment ? (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg flex-shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">
                          {dept.headOfDepartment.user.firstName} {dept.headOfDepartment.user.lastName}
                        </h4>
                        <span className="text-2xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                          Head of Department
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {dept.headOfDepartment.designation || 'Senior Professor / Faculty Lead'}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mt-3.5 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-slate-400" /> {dept.headOfDepartment.user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <User className="h-8 w-8 text-slate-300" />
                    <h4 className="font-semibold text-sm text-slate-700">No leadership appointed</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This department currently has no active Head of Department appointed. An administrator can appoint a leader from the teacher database.
                    </p>
                  </div>
                )}
              </Card>

              {/* Security & System Metadata */}
              <Card title="System Metadata" className="border border-slate-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Created At</p>
                      <p className="text-slate-500 mt-0.5">
                        {new Date(dept.createdAt).toLocaleString()}
                      </p>
                      {dept.createdBy && (
                        <p className="text-2xs text-slate-400 mt-0.5">By Administrator ID: {dept.createdBy}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Last Modified</p>
                      <p className="text-slate-500 mt-0.5">
                        {new Date(dept.updatedAt).toLocaleString()}
                      </p>
                      {dept.updatedBy && (
                        <p className="text-2xs text-slate-400 mt-0.5">By Administrator ID: {dept.updatedBy}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
};
export default DepartmentDetailPage;
