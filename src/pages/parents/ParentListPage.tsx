import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Briefcase,
  HeartHandshake,
} from 'lucide-react';

interface ParentItem {
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
  }>;
}

export const ParentListPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [parents, setParents] = useState<ParentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [relationFilter, setRelationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchParents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/parents', {
        params: {
          search,
          relation: relationFilter || undefined,
          page,
          limit,
        },
      });

      if (response.data?.status === 'success') {
        setParents(response.data.data.parents);
        setTotal(response.data.data.total);
      } else {
        throw new Error('Failed to retrieve parent directory');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 'An error occurred while fetching parents'
      );
    } finally {
      setLoading(false);
    }
  }, [search, relationFilter, page, limit]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to remove this parent guardian record?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/parents/${uuid}`);
      if (response.status === 200 || response.data?.status === 'success') {
        fetchParents();
      } else {
        throw new Error('Failed to delete parent record');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to delete parent record');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer
      title="Parent & Guardian Directory"
      description="Parent portal governance, family relations, and linked student ward oversight."
      action={
        isAdmin && (
          <Link to="/parents/create">
            <Button variant="primary" leftIcon={Plus}>
              New Parent Record
            </Button>
          </Link>
        )
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Registered Parents</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{total}</h3>
            </div>
          </Card>
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Guardians Active</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {parents.filter((p) => p.status === 'ACTIVE').length} Active
              </h3>
            </div>
          </Card>
          <Card className="p-5 flex items-center space-x-4 border-l-4 border-indigo-500">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Wards Associated</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {(Array.isArray(parents) ? parents : []).reduce((acc, p) => acc + (p.students?.length || 0), 0)} Students
              </h3>
            </div>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search by parent name, occupation, email..."
                className="w-full pl-10 pr-20 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Filter className="h-4 w-4 text-gray-400" />
                <span>Relation:</span>
              </div>
              <select
                className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2"
                value={relationFilter}
                onChange={(e) => {
                  setRelationFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Relations</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>

              <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={fetchParents}>
                Reload
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Directory Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-mono text-gray-500">Retrieving parent profiles...</p>
            </div>
          ) : parents.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-800">No Parent Profiles Found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting search parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-mono uppercase text-gray-500 tracking-wider">
                    <th className="py-4 px-6 font-medium">Parent / Guardian</th>
                    <th className="py-4 px-6 font-medium">Relation</th>
                    <th className="py-4 px-6 font-medium">Occupation</th>
                    <th className="py-4 px-6 font-medium">Linked Student Wards</th>
                    <th className="py-4 px-6 font-medium">Status</th>
                    <th className="py-4 px-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-sans text-gray-700">
                  {parents.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">
                          {item.user?.firstName} {item.user?.lastName}
                        </div>
                        <div className="text-xs font-mono text-gray-500">{item.user?.email}</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">{item.relation}</td>
                      <td className="py-4 px-6 text-gray-600">{item.occupation || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {item.students && item.students.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.students.map((st) => (
                              <span
                                key={st.uuid}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded"
                              >
                                {st.user?.firstName} ({st.registrationNumber})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None linked</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}
                        >
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link to={`/parents/${item.uuid}`}>
                            <Button variant="ghost" size="sm" className="p-1.5 text-gray-500 hover:text-gray-900">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isAdmin && (
                            <>
                              <Link to={`/parents/${item.uuid}/edit`}>
                                <Button variant="ghost" size="sm" className="p-1.5 text-gray-500 hover:text-primary">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 text-gray-500 hover:text-red-600"
                                onClick={() => handleDelete(item.uuid)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  leftIcon={ChevronLeft}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  leftIcon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
