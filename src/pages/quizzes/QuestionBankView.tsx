import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { QuestionBank, QuestionOption } from './types';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  Filter,
  CheckSquare,
  Compass,
  Zap,
} from 'lucide-react';

interface QuestionBankViewProps {
  courseOfferingId?: number;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ courseOfferingId }) => {
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOffering, setSelectedOffering] = useState<string>(courseOfferingId ? String(courseOfferingId) : '');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    courseOfferingId: courseOfferingId ? String(courseOfferingId) : '',
    title: '',
    topic: '',
    difficultyLevel: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    questionType: 'MCQ' as 'MCQ' | 'TrueFalse' | 'MultipleSelect',
    questionText: '',
    explanation: '',
    marks: '1',
    negativeMarks: '0',
    attachments: '',
  });

  const [options, setOptions] = useState<QuestionOption[]>([
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ]);

  // Load course offerings for question creation
  const loadOfferings = async () => {
    try {
      const res = await apiClient.get('/course-offerings');
      if (res.data?.success) {
        setOfferings(res.data.data || []);
        if (!selectedOffering && res.data.data?.length > 0) {
          setSelectedOffering(String(res.data.data[0].id));
          setFormData((f) => ({ ...f, courseOfferingId: String(res.data.data[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/quizzes/questions', {
        params: {
          search: search || undefined,
          courseOfferingId: selectedOffering || undefined,
          difficultyLevel: difficultyFilter || undefined,
          questionType: typeFilter || undefined,
        },
      });
      if (res.data?.success) {
        setQuestions(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [search, selectedOffering, difficultyFilter, typeFilter]);

  const handleTypeChange = (type: 'MCQ' | 'TrueFalse' | 'MultipleSelect') => {
    setFormData((f) => ({ ...f, questionType: type }));
    if (type === 'TrueFalse') {
      setOptions([
        { optionText: 'True', isCorrect: false },
        { optionText: 'False', isCorrect: false },
      ]);
    } else {
      setOptions([
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ]);
    }
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].optionText = text;
    setOptions(updated);
  };

  const handleOptionCorrectChange = (index: number, isChecked: boolean) => {
    const updated = [...options];
    if (formData.questionType === 'MCQ' || formData.questionType === 'TrueFalse') {
      updated.forEach((o, i) => {
        o.isCorrect = i === index ? isChecked : false;
      });
    } else {
      updated[index].isCorrect = isChecked;
    }
    setOptions(updated);
  };

  const addOptionField = () => {
    if (formData.questionType === 'TrueFalse') return;
    setOptions([...options, { optionText: '', isCorrect: false }]);
  };

  const removeOptionField = (index: number) => {
    if (formData.questionType === 'TrueFalse') return;
    if (options.length <= 2) {
      toast.error('Questions must have at least 2 options.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      courseOfferingId: courseOfferingId ? String(courseOfferingId) : selectedOffering,
      title: '',
      topic: '',
      difficultyLevel: 'Medium',
      questionType: 'MCQ',
      questionText: '',
      explanation: '',
      marks: '1',
      negativeMarks: '0',
      attachments: '',
    });
    setOptions([
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (q: QuestionBank) => {
    setEditingId(q.id);
    setFormData({
      courseOfferingId: String(q.courseOfferingId),
      title: q.title || '',
      topic: q.topic || '',
      difficultyLevel: q.difficultyLevel,
      questionType: q.questionType as 'MCQ' | 'TrueFalse' | 'MultipleSelect',
      questionText: q.questionText,
      explanation: q.explanation || '',
      marks: String(q.marks),
      negativeMarks: String(q.negativeMarks),
      attachments: q.attachments || '',
    });
    setOptions(
      q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        isCorrect: !!o.isCorrect,
      }))
    );
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await apiClient.delete(`/quizzes/questions/${id}`);
      if (res.data?.success) {
        toast.success('Question deleted.');
        loadQuestions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseOfferingId) {
      toast.error('Please select a course offering.');
      return;
    }
    if (!formData.questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }

    // Validate options
    const filteredOptions = options.map((o) => ({
      ...o,
      optionText: o.optionText.trim(),
    }));

    if (filteredOptions.some((o) => !o.optionText)) {
      toast.error('All options must have text.');
      return;
    }

    const correctCount = filteredOptions.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      toast.error('Please mark at least one correct option.');
      return;
    }

    const payload = {
      ...formData,
      marks: parseFloat(formData.marks),
      negativeMarks: parseFloat(formData.negativeMarks),
      options: filteredOptions,
    };

    try {
      if (editingId) {
        const res = await apiClient.put(`/quizzes/questions/${editingId}`, payload);
        if (res.data?.success) {
          toast.success('Question updated successfully.');
          resetForm();
          loadQuestions();
        }
      } else {
        const res = await apiClient.post(`/quizzes/${formData.courseOfferingId}/questions`, payload);
        if (res.data?.success) {
          toast.success('Question added to bank.');
          resetForm();
          loadQuestions();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save question.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {!showForm && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedOffering}
              onChange={(e) => setSelectedOffering(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Course Offerings</option>
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.courseCode} - {o.subject?.name}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="TrueFalse">True/False</option>
              <option value="MultipleSelect">Multiple Select</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </Button>
          </div>
        </div>
      )}

      {showForm ? (
        <Card className="p-6 max-w-3xl mx-auto border border-gray-200 bg-white">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Question' : 'Create New Question'}
            </h3>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Course Offering *
                </label>
                <select
                  required
                  disabled={!!courseOfferingId}
                  value={formData.courseOfferingId}
                  onChange={(e) => setFormData({ ...formData, courseOfferingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Offering</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.courseCode} - {o.subject?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Topic / Sub-topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Question Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MCQ', 'TrueFalse', 'MultipleSelect'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`px-3 py-2 border rounded-lg text-xs font-medium text-center transition-colors ${
                        formData.questionType === t
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {t === 'TrueFalse' ? 'True/False' : t === 'MultipleSelect' ? 'Multiple Sel' : 'MCQ'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Neg. Marks (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Reference Title / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graph Q3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Question Text *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Enter the question contents here. Support formulas or plain descriptions."
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Answers Options Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Answer Options</h4>
                {formData.questionType !== 'TrueFalse' && (
                  <Button type="button" variant="ghost" size="sm" onClick={addOptionField} className="text-xs text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type={formData.questionType === 'MultipleSelect' ? 'checkbox' : 'radio'}
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      disabled={formData.questionType === 'TrueFalse'}
                      value={opt.optionText}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.questionType !== 'TrueFalse' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOptionField(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Solution Explanation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Provide a detailed explanation of the solution. Visible to students after submitting if enabled."
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingId ? 'Update Question' : 'Save Question'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-sm text-gray-500 col-span-2">Loading question bank...</p>
          ) : questions.length === 0 ? (
            <Card className="col-span-2 p-8 text-center text-gray-500 border border-gray-100 bg-white">
              No questions found matching your filter criteria.
            </Card>
          ) : (
            questions.map((q) => (
              <Card key={q.id} className="p-5 border border-gray-100 hover:border-gray-200 transition-colors bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        q.difficultyLevel === 'Easy'
                          ? 'bg-green-50 text-green-700'
                          : q.difficultyLevel === 'Hard'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {q.difficultyLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-600 font-semibold uppercase">
                        {q.questionType}
                      </span>
                      {q.topic && (
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide flex items-center">
                          <Compass className="h-3 w-3 mr-1" /> {q.topic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(q)} className="text-gray-400 hover:text-indigo-600">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-3">
                    {q.questionText}
                  </h4>

                  <div className="space-y-1.5 mt-3 pl-2 border-l-2 border-indigo-50">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center space-x-2 text-xs">
                        {opt.isCorrect ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <div className="h-4 w-4 rounded border border-gray-200 flex items-center justify-center text-gray-300">
                            -
                          </div>
                        )}
                        <span className={opt.isCorrect ? 'text-emerald-700 font-medium' : 'text-gray-600'}>
                          {opt.optionText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <div className="flex items-center space-x-1 font-medium">
                    <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                    <span>{q.courseOffering?.courseCode || 'Offering'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-indigo-600 font-semibold">{q.marks} Marks</span>
                    {q.negativeMarks > 0 && (
                      <span className="text-rose-500 font-medium">-{q.negativeMarks} Neg</span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
