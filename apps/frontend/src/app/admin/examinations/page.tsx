'use client';

import { useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi, CurriculumItem } from '@/lib/api';

// Helper to render math expressions using KaTeX
const renderMathText = (text: string): string => {
  if (!text) return '';
  
  // Split text by $ to find math expressions
  const parts = text.split(/(\$[^$]+\$)/);
  return parts.map((part) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1);
      try {
        return katex.renderToString(mathContent, { throwOnError: false, displayMode: false });
      } catch {
        return part;
      }
    }
    return DOMPurify.sanitize(part);
  }).join('');
};

interface ExamQuestionForm {
  type: 'essay' | 'multiple_choice';
  questionText: string;
  optionText1: string;
  optionText2: string;
  optionText3: string;
  optionText4: string;
  correctOptionIndex: number;
  points: number;
  answer: string;
  questionImage?: File | null;
  optionImages: Array<File | null>;
}

interface ExaminationRecord {
  id: string;
  title: string;
  examType?: string;
  description?: string;
  examDate?: string;
  examStartTime?: string;
  examEndTime?: string;
}

interface MathExpressionOption {
  label: string;
  latex: string;
  display: string;
}

const MATH_EXPRESSIONS: MathExpressionOption[] = [
  { label: 'Square Root', latex: '\\sqrt{x}', display: '√x' },
  { label: 'Cube Root', latex: '\\sqrt[3]{x}', display: '∛x' },
  { label: 'Fraction', latex: '\\frac{a}{b}', display: 'a/b' },
  { label: 'Power', latex: 'x^2', display: 'x²' },
  { label: 'Subscript', latex: 'x_i', display: 'xᵢ' },
  { label: 'Plus-Minus', latex: '\\pm', display: '±' },
  { label: 'Infinity', latex: '\\infty', display: '∞' },
  { label: 'Integral', latex: '\\int', display: '∫' },
  { label: 'Sum', latex: '\\sum', display: '∑' },
  { label: 'Not Equal', latex: '\\neq', display: '≠' },
  { label: 'Less/Equal', latex: '\\leq', display: '≤' },
  { label: 'Greater/Equal', latex: '\\geq', display: '≥' },
];

export default function ExaminationManagementPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [examCurriculumId, setExamCurriculumId] = useState('');
  const [examinations, setExaminations] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [pendingExamTitle, setPendingExamTitle] = useState('');
  const [pendingExamType, setPendingExamType] = useState('Regular Examination');
  const [pendingExamDescription, setPendingExamDescription] = useState('');
  const [pendingExamDate, setPendingExamDate] = useState('');
  const [pendingExamStart, setPendingExamStart] = useState('');
  const [pendingExamEnd, setPendingExamEnd] = useState('');
  const [isEditingExamDetails, setIsEditingExamDetails] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showUnlockWarning, setShowUnlockWarning] = useState(false);
  const [showGenerateQuestionsModal, setShowGenerateQuestionsModal] = useState(false);
  const [generateMultipleChoiceCount, setGenerateMultipleChoiceCount] = useState(3);
  const [generateEssayCount, setGenerateEssayCount] = useState(2);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [selectedGeneratedQuestionIndexes, setSelectedGeneratedQuestionIndexes] = useState<number[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const questionTextRef = React.useRef<HTMLTextAreaElement>(null);
  const optionTextsRef = React.useRef<{ [key: number]: HTMLInputElement }>({});
  const [questionForm, setQuestionForm] = useState<ExamQuestionForm>({
    type: 'multiple_choice',
    questionText: '',
    optionText1: '',
    optionText2: '',
    optionText3: '',
    optionText4: '',
    correctOptionIndex: 0,
    points: 1,
    answer: '',
    questionImage: null,
    optionImages: [null, null, null, null],
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [userRole, setUserRole] = useState('');
  const [existingQuestionImageUrl, setExistingQuestionImageUrl] = useState<string | null>(null);
  const [existingQuestionImageFileId, setExistingQuestionImageFileId] = useState<string | null>(null);
  const [existingOptionImageUrls, setExistingOptionImageUrls] = useState<Array<string | null>>([null, null, null, null]);
  const [existingOptionImageFileIds, setExistingOptionImageFileIds] = useState<Array<string | null>>([null, null, null, null]);

  const resetQuestionForm = () => {
    setQuestionForm({
      type: 'multiple_choice',
      questionText: '',
      optionText1: '',
      optionText2: '',
      optionText3: '',
      optionText4: '',
      correctOptionIndex: 0,
      points: 1,
      answer: '',
      questionImage: null,
      optionImages: [null, null, null, null],
    });
    setEditingQuestionId(null);
    setEditingQuestionIndex(null);
    setExistingQuestionImageUrl(null);
    setExistingQuestionImageFileId(null);
    setExistingOptionImageUrls([null, null, null, null]);
    setExistingOptionImageFileIds([null, null, null, null]);
  };

  const populateQuestionForm = (question: any) => {
    const options = Array.isArray(question.options) ? question.options : [];
    setQuestionForm({
      type: question.type === 'essay' ? 'essay' : 'multiple_choice',
      questionText: question.questionText || '',
      optionText1: options[0]?.text || '',
      optionText2: options[1]?.text || '',
      optionText3: options[2]?.text || '',
      optionText4: options[3]?.text || '',
      correctOptionIndex: typeof question.correctOptionIndex === 'number' ? question.correctOptionIndex : 0,
      points: Number(question.points ?? 1),
      answer: question.answer || '',
      questionImage: null,
      optionImages: [null, null, null, null],
    });
    setExistingQuestionImageUrl(question.questionImageUrl || null);
    setExistingQuestionImageFileId(question.questionImageFileId || null);
    setExistingOptionImageUrls([0, 1, 2, 3].map((index) => options[index]?.imageUrl || null));
    setExistingOptionImageFileIds([0, 1, 2, 3].map((index) => options[index]?.imageFileId || null));
    setEditingQuestionId(question.id || null);
    setEditingQuestionIndex(questions.findIndex((item) => item.id === question.id));
  };

  const insertMathExpression = (target: 'question' | 'option', expression: string, optionIndex?: number) => {
    if (target === 'question' && questionTextRef.current) {
      const textarea = questionTextRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.slice(0, start) + `$${expression}$` + text.slice(end);
      setQuestionForm((prev) => ({ ...prev, questionText: newText }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + expression.length + 2, start + expression.length + 2);
      }, 0);
    } else if (target === 'option' && optionIndex !== undefined && optionTextsRef.current[optionIndex]) {
      const input = optionTextsRef.current[optionIndex];
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      const newText = text.slice(0, start) + `$${expression}$` + text.slice(end);
      setQuestionForm((prev) => {
        const updated = { ...prev };
        if (optionIndex === 0) updated.optionText1 = newText;
        else if (optionIndex === 1) updated.optionText2 = newText;
        else if (optionIndex === 2) updated.optionText3 = newText;
        else if (optionIndex === 3) updated.optionText4 = newText;
        return updated;
      });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + expression.length + 2, start + expression.length + 2);
      }, 0);
    }
  };

  const loadCurriculums = async () => {
    try {
      const data = await authApi.admin.curriculums();
      const next = Array.isArray(data) ? data : [];
      setCurriculums(next);
      if (!selectedCurriculumId && next[0]) {
        setSelectedCurriculumId(next[0].id);
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to load curriculum data.' });
    }
  };

  const loadExaminations = async (curriculumId: string) => {
    if (!curriculumId) {
      setExaminations([]);
      setSelectedExamId('');
      setQuestions([]);
      return;
    }

    try {
      const data = await authApi.admin.getCurriculumExaminations(curriculumId);
      const next = Array.isArray(data) ? data : [];
      setExaminations(next);
      setSelectedExamId('');
      setQuestions([]);
    } catch (error: any) {
      setExaminations([]);
      setSelectedExamId('');
      setQuestions([]);
      setAlert({ type: 'error', message: error.message || 'Failed to load examinations.' });
    }
  };

  const loadQuestions = async (examId: string) => {
    setQuestions([]);
    if (!examId) {
      return;
    }

    try {
      const data = await authApi.admin.getExaminationQuestions(examId);
      if (selectedExamId !== examId) return;
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setQuestions([]);
      setAlert({ type: 'error', message: error.message || 'Failed to load exam questions.' });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setUserRole(localStorage.getItem('userRole') || '');
    void (async () => {
      setIsLoading(true);
      await loadCurriculums();
      setIsLoading(false);
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedCurriculumId) return;
    void loadExaminations(selectedCurriculumId);
  }, [selectedCurriculumId]);

  useEffect(() => {
    if (!selectedExamId) return;
    void loadQuestions(selectedExamId);
  }, [selectedExamId]);

  const selectedCurriculum = useMemo(
    () => curriculums.find((item) => item.id === selectedCurriculumId),
    [curriculums, selectedCurriculumId],
  );

  const selectedExam = useMemo(
    () => examinations.find((exam) => String(exam.id) === String(selectedExamId)),
    [examinations, selectedExamId],
  );
  const isPrincipal = userRole === 'Principal';

  const validateExamSchedule = (examDate: string, startTime: string, endTime: string) => {
    if (examDate && startTime && endTime && new Date(`${examDate}T${endTime}`) <= new Date(`${examDate}T${startTime}`)) {
      setAlert({ type: 'error', message: 'Waktu selesai harus setelah waktu mulai.' });
      return false;
    }
    return true;
  };

  const approveSelectedExam = async () => {
    if (!selectedExamId) return;
    setIsSaving(true);
    try {
      await authApi.admin.approveExamination(selectedExamId);
      setAlert({ type: 'success', message: 'Examination approved and locked.' });
      if (selectedCurriculumId) await loadExaminations(selectedCurriculumId);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to approve examination.' });
    } finally { setIsSaving(false); }
  };

  const generateQuestions = async () => {
    if (!selectedExamId) {
      setAlert({ type: 'error', message: 'Pilih ujian terlebih dahulu sebelum membuat soal dengan AI.' });
      return;
    }
    setIsGeneratingQuestions(true);
    try {
      const result = await authApi.admin.generateExaminationQuestions({
        subjectName: selectedCurriculum?.subjectName,
        gradeLevel: selectedCurriculum?.gradeLevel,
        multipleChoiceCount: generateMultipleChoiceCount,
        essayCount: generateEssayCount,
      });
      setGeneratedQuestions(result.questions || []);
      setSelectedGeneratedQuestionIndexes([]);
      setAlert({ type: 'success', message: 'Soal berhasil dibuat. Pilih soal untuk memasukkannya ke builder.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Gagal membuat soal dengan AI.' });
    } finally { setIsGeneratingQuestions(false); }
  };

  const useGeneratedQuestion = (question: any) => {
    const options = Array.isArray(question.options) ? question.options : [];
    setQuestionForm((current) => ({
      ...current,
      type: question.type === 'essay' ? 'essay' : 'multiple_choice',
      questionText: question.questionText || '',
      optionText1: options[0] || '',
      optionText2: options[1] || '',
      optionText3: options[2] || '',
      optionText4: options[3] || '',
      correctOptionIndex: Number(question.correctOptionIndex || 0),
      points: Math.max(1, Math.round(Number(question.points) || 1)),
      answer: question.answer || '',
    }));
    setShowGenerateQuestionsModal(false);
    setGeneratedQuestions([]);
  };

  const toggleGeneratedQuestion = (index: number) => {
    setSelectedGeneratedQuestionIndexes((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]);
  };

  const saveGeneratedQuestions = async () => {
    if (!selectedExamId) {
      setAlert({ type: 'error', message: 'Pilih ujian terlebih dahulu sebelum menyimpan soal.' });
      return;
    }
    if (selectedGeneratedQuestionIndexes.length === 0) {
      setAlert({ type: 'error', message: 'Pilih minimal satu soal untuk disimpan.' });
      return;
    }
    setIsSaving(true);
    try {
      const created: any[] = [];
      for (const index of selectedGeneratedQuestionIndexes) {
        const question = generatedQuestions[index];
        const options = question.type === 'multiple_choice' && Array.isArray(question.options)
          ? question.options.map((text: string) => ({ text, imageUrl: undefined, imageFileId: undefined }))
          : [];
        created.push(await authApi.admin.createExaminationQuestion(selectedExamId, {
          type: question.type === 'essay' ? 'essay' : 'multiple_choice',
          questionText: question.questionText,
          options,
          correctOptionIndex: question.type === 'multiple_choice' ? Number(question.correctOptionIndex || 0) : undefined,
          points: Math.max(1, Math.round(Number(question.points) || 1)),
          answer: question.answer || undefined,
        }));
      }
      setQuestions((current) => [...current, ...created]);
      setAlert({ type: 'success', message: `${created.length} soal berhasil disimpan ke ujian.` });
      setGeneratedQuestions([]);
      setSelectedGeneratedQuestionIndexes([]);
      setShowGenerateQuestionsModal(false);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Gagal menyimpan soal hasil AI.' });
    } finally { setIsSaving(false); }
  };

  const unlockSelectedExam = async () => {
    if (!selectedExamId) return;
    setShowUnlockWarning(false);
    setIsSaving(true);
    try {
      await authApi.admin.unlockExamination(selectedExamId);
      setAlert({ type: 'success', message: 'Ujian dibuka kuncinya dan dapat diedit kembali.' });
      if (selectedCurriculumId) await loadExaminations(selectedCurriculumId);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Gagal membuka kunci ujian.' });
    } finally { setIsSaving(false); }
  };

  const saveExamDetails = async () => {
    if (!selectedExamId || !selectedCurriculumId) return;
    if (!validateExamSchedule(pendingExamDate, pendingExamStart, pendingExamEnd)) return;
    setIsSaving(true);
    try {
      await authApi.admin.updateCurriculumExamination(selectedCurriculumId, selectedExamId, {
        title: pendingExamTitle.trim(),
        examType: pendingExamType,
        description: pendingExamDescription.trim() || undefined,
        examDate: pendingExamDate || undefined,
        examStartTime: pendingExamStart || undefined,
        examEndTime: pendingExamEnd || undefined,
      });
      setIsEditingExamDetails(false);
      await loadExaminations(selectedCurriculumId);
      setAlert({ type: 'success', message: 'Detail ujian berhasil diperbarui.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Gagal memperbarui detail ujian.' });
    } finally { setIsSaving(false); }
  };

  const beginExamDetailsEdit = () => {
    if (!selectedExam) return;
    setPendingExamTitle(selectedExam.title || '');
    setPendingExamType(selectedExam.examType || 'Regular Examination');
    setPendingExamDescription(selectedExam.description || '');
    setPendingExamDate(selectedExam.examDate || '');
    setPendingExamStart(selectedExam.examStartTime || '');
    setPendingExamEnd(selectedExam.examEndTime || '');
    setIsEditingExamDetails(true);
  };

  const createExam = async () => {
    if (!examCurriculumId) {
      setAlert({ type: 'error', message: 'Please select a curriculum for the examination.' });
      return;
    }

    if (!pendingExamTitle.trim()) {
      setAlert({ type: 'error', message: 'Examination title is required.' });
      return;
    }
    if (!validateExamSchedule(pendingExamDate, pendingExamStart, pendingExamEnd)) return;

    setIsSaving(true);
    try {
      const nextExam = (await authApi.admin.createCurriculumExamination(examCurriculumId, {
        title: pendingExamTitle.trim(),
        examType: pendingExamType || 'Regular Examination',
        description: pendingExamDescription.trim() || undefined,
        examDate: pendingExamDate || undefined,
        examStartTime: pendingExamStart || undefined,
        examEndTime: pendingExamEnd || undefined,
      })) as ExaminationRecord;
      setSelectedExamId(String(nextExam.id));
      setPendingExamTitle('');
      setPendingExamType('Regular Examination');
      setPendingExamDescription('');
      setPendingExamDate('');
      setPendingExamStart('');
      setPendingExamEnd('');
      await loadExaminations(examCurriculumId);
      setAlert({ type: 'success', message: 'Examination created successfully.' });
      setShowCreateExamModal(false);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to create examination.' });
    } finally {
      setIsSaving(false);
    }
  };

  const createQuestion = async () => {
    if (!selectedExamId) {
      setAlert({ type: 'error', message: 'Please create or choose an examination first.' });
      return;
    }

    const trimmedText = questionForm.questionText.trim();
    if (!trimmedText && !questionForm.questionImage) {
      setAlert({ type: 'error', message: 'Question text or image is required.' });
      return;
    }

    if (questionForm.type === 'multiple_choice') {
      const optionValues = [questionForm.optionText1, questionForm.optionText2, questionForm.optionText3, questionForm.optionText4]
        .map((item) => item.trim());
      const optionImages = questionForm.optionImages.filter(Boolean) as File[];
      const filledOptionCount = optionValues.filter(Boolean).length + optionImages.length;

      if (filledOptionCount < 2) {
        setAlert({ type: 'error', message: 'Multiple choice questions need at least two non-empty options or image options.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const optionTexts = [questionForm.optionText1, questionForm.optionText2, questionForm.optionText3, questionForm.optionText4];
      const occupiedOptionIndices = optionTexts.reduce<number[]>((result, value, index) => {
        if (value.trim() || questionForm.optionImages[index]) result.push(index);
        return result;
      }, []);
      const options = questionForm.type === 'multiple_choice'
        ? occupiedOptionIndices.reduce<Array<{ text?: string; imageFileId?: string; imageUrl?: string }>>((result, index) => {
            const value = optionTexts[index];
            const text = value.trim();
            result.push({
              text: text || undefined,
              imageFileId: existingOptionImageFileIds[index] || undefined,
              imageUrl: undefined,
            });
            return result;
          }, [])
        : [];
      const optionImages = questionForm.type === 'multiple_choice'
        ? occupiedOptionIndices.filter((index) => Boolean(questionForm.optionImages[index])).map((index) => questionForm.optionImages[index]) as File[]
        : [];
      const optionImageIndexes = questionForm.type === 'multiple_choice'
        ? occupiedOptionIndices.filter((index) => Boolean(questionForm.optionImages[index]))
        : [];

      if (editingQuestionId && editingQuestionIndex !== null) {
        const updated = await authApi.admin.updateExaminationQuestion(selectedExamId, editingQuestionId, {
          type: questionForm.type,
          questionText: trimmedText,
          correctOptionIndex: questionForm.correctOptionIndex,
          points: questionForm.points,
          answer: questionForm.answer.trim() || undefined,
          existingQuestionImageFileId: existingQuestionImageFileId || undefined,
          options,
          optionImages,
          optionImageIndexes,
          questionImage: questionForm.questionImage || undefined,
        });
        setQuestions((current) => current.map((question, index) => index === editingQuestionIndex ? updated : question));
        setAlert({ type: 'success', message: 'Question updated successfully.' });
        resetQuestionForm();
        return;
      }

      const uploaded = await authApi.admin.createExaminationQuestion(selectedExamId, {
        type: questionForm.type,
        questionText: trimmedText,
        points: questionForm.points,
        answer: questionForm.answer.trim() || undefined,
        options,
        correctOptionIndex: questionForm.type === 'multiple_choice'
          ? occupiedOptionIndices.indexOf(questionForm.correctOptionIndex)
          : questionForm.correctOptionIndex,
        questionImage: questionForm.questionImage || undefined,
        optionImages,
        optionImageIndexes,
      });
      setQuestions((current) => [...current, uploaded]);
      resetQuestionForm();
      setAlert({ type: 'success', message: 'Question saved successfully.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to save question.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell title="Manajemen Ujian">
      <div className="mx-auto max-w-7xl space-y-6">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {!isPrincipal && <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div><h3 className="text-lg font-semibold text-[var(--foreground)]">Manajemen Ujian</h3><p className="text-sm text-[var(--muted)]">Buat ujian baru dari tombol ini.</p></div>
          <Button type="button" onClick={() => setShowCreateExamModal(true)}>Buat Ujian</Button>
        </div>}

        {showCreateExamModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Buat Ujian">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-[var(--foreground)]">Buat Ujian</h3><button type="button" onClick={() => setShowCreateExamModal(false)} className="rounded px-3 py-1 text-xl text-[var(--muted)] hover:bg-[var(--background)]" aria-label="Tutup">×</button></div>
          <div className="space-y-3">
            <Input label="Judul" value={pendingExamTitle} onChange={(event) => setPendingExamTitle(event.target.value)} />
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Kurikulum</label>
              <select
                value={examCurriculumId}
                onChange={(event) => setExamCurriculumId(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
              >
                <option value="">Pilih kurikulum</option>
                {curriculums.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.subjectName} • Grade {curriculum.gradeLevel} • {curriculum.year ?? new Date().getFullYear()}{curriculum.endYear ? ` - ${curriculum.endYear}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Type</label>
              <select
                value={pendingExamType}
                onChange={(event) => setPendingExamType(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
              >
                <option value="Regular Examination">Regular Examination</option>
                <option value="Mid Term Examination">Mid Term Examination</option>
                <option value="Final Examination">Final Examination</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Date" type="date" value={pendingExamDate} onChange={(event) => setPendingExamDate(event.target.value)} />
              <Input label="Start Time" type="time" value={pendingExamStart} onChange={(event) => setPendingExamStart(event.target.value)} />
              <Input label="End Time" type="time" value={pendingExamEnd} onChange={(event) => setPendingExamEnd(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
              <textarea
                value={pendingExamDescription}
                onChange={(event) => setPendingExamDescription(event.target.value)}
                rows={5}
                className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void createExam()} isLoading={isSaving}>Simpan Ujian</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateExamModal(false)}>Batal</Button>
            </div>
          </div>
        </div>
        </div>}

        {showGenerateQuestionsModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Buat Soal dengan AI">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[var(--surface)] p-5 shadow-2xl">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-[var(--foreground)]">Buat Soal dengan AI</h2><p className="text-sm text-[var(--muted)]">Pilih jumlah soal untuk dibuat berdasarkan kurikulum yang dipilih.</p></div><button type="button" onClick={() => setShowGenerateQuestionsModal(false)} className="text-2xl text-[var(--muted)]" aria-label="Tutup">×</button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Input label="Jumlah Pilihan Ganda" type="number" min={0} max={20} value={generateMultipleChoiceCount} onChange={(event) => setGenerateMultipleChoiceCount(Math.max(0, Math.min(20, Number(event.target.value) || 0)))} /><Input label="Jumlah Soal Esai" type="number" min={0} max={20} value={generateEssayCount} onChange={(event) => setGenerateEssayCount(Math.max(0, Math.min(20, Number(event.target.value) || 0)))} /></div>
            <div className="mt-5 flex justify-end"><Button type="button" onClick={() => void generateQuestions()} isLoading={isGeneratingQuestions}>Buat Soal</Button></div>
            {generatedQuestions.length > 0 && <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[var(--foreground)]">Hasil Soal AI</h3><button type="button" onClick={() => setSelectedGeneratedQuestionIndexes(selectedGeneratedQuestionIndexes.length === generatedQuestions.length ? [] : generatedQuestions.map((_, index) => index))} className="text-sm font-medium text-blue-600 hover:underline">{selectedGeneratedQuestionIndexes.length === generatedQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</button></div>{generatedQuestions.map((question, index) => <label key={index} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--background)]"><input type="checkbox" checked={selectedGeneratedQuestionIndexes.includes(index)} onChange={() => toggleGeneratedQuestion(index)} className="mt-1 h-4 w-4 rounded border-[var(--border)] text-blue-600" /><span><span className="block font-medium text-[var(--foreground)]">{index + 1}. {question.questionText}</span><span className="mt-1 block text-xs text-[var(--muted)]">{question.type === 'essay' ? 'Esai' : 'Pilihan Ganda'} • {question.points || 1} poin</span></span></label>)}<div className="flex justify-end"><Button type="button" onClick={() => void saveGeneratedQuestions()} isLoading={isSaving} disabled={selectedGeneratedQuestionIndexes.length === 0}>Konfirmasi dan Simpan ({selectedGeneratedQuestionIndexes.length})</Button></div></div>}
          </div>
        </div>}
        {isGeneratingQuestions && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"><div className="rounded-xl bg-[var(--surface)] px-8 py-7 text-center shadow-2xl"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="mt-4 font-semibold text-[var(--foreground)]">AI sedang membuat soal...</p></div></div>}
        {showUnlockWarning && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl border border-amber-200 bg-[var(--surface)] p-6 shadow-2xl"><h2 className="text-xl font-semibold text-[var(--foreground)]">Buka Kunci Ujian?</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Membuka kunci memungkinkan jadwal, detail, dan soal diubah kembali. Pastikan perubahan sudah mendapat persetujuan sebelum ujian digunakan siswa.</p><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowUnlockWarning(false)}>Batal</Button><Button type="button" variant="danger" onClick={() => void unlockSelectedExam()} isLoading={isSaving}>Buka Kunci</Button></div></div></div>}

        {/* Examination Management Section */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Manajemen Detail Ujian &amp; Soal</h2>
              <p className="text-sm text-[var(--muted)]">Atur detail ujian dan buat soal untuk setiap penilaian.</p>
            </div>
            {['Principal', 'SysAdmin'].includes(userRole) && selectedExamId && (
              <div className="flex flex-wrap justify-end gap-2">
                {selectedExam?.approvalStatus === 'approved' ? (
                  <Button type="button" variant="danger" onClick={() => setShowUnlockWarning(true)} isLoading={isSaving}>
                    Buka Kunci Ujian
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => void approveSelectedExam()} isLoading={isSaving}>
                    Setujui Ujian
                  </Button>
                )}
                {selectedExam?.approvalStatus !== 'approved' && (
                  <Button type="button" variant="secondary" onClick={beginExamDetailsEdit}>
                    Edit Detail Ujian
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Kurikulum</label>
              <select
                value={selectedCurriculumId}
                onChange={(event) => setSelectedCurriculumId(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
              >
                <option value="">Pilih kurikulum</option>
                {curriculums.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.subjectName} • Grade {curriculum.gradeLevel} • {curriculum.year ?? new Date().getFullYear()}{curriculum.endYear ? ` - ${curriculum.endYear}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Ujian</label>
              <select
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
              >
                <option value="">Pilih ujian</option>
                {examinations.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!isPrincipal && isEditingExamDetails && selectedExam && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-amber-950">Edit Detail Ujian</h3>
                <p className="text-sm text-amber-800">Pastikan tanggal dan waktu sudah benar sebelum menyimpan.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setIsEditingExamDetails(false)}>Batal</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Judul" value={pendingExamTitle} onChange={(event) => setPendingExamTitle(event.target.value)} />
              <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Jenis Ujian</label><select value={pendingExamType} onChange={(event) => setPendingExamType(event.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"><option value="Regular Examination">Ujian Reguler</option><option value="Mid Term Examination">Ujian Tengah Semester</option><option value="Final Examination">Ujian Akhir Semester</option></select></div>
              <Input label="Tanggal" type="date" value={pendingExamDate} onChange={(event) => setPendingExamDate(event.target.value)} />
              <Input label="Waktu Mulai" type="time" value={pendingExamStart} onChange={(event) => setPendingExamStart(event.target.value)} />
              <Input label="Waktu Selesai" type="time" value={pendingExamEnd} onChange={(event) => setPendingExamEnd(event.target.value)} />
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Deskripsi</label><textarea value={pendingExamDescription} onChange={(event) => setPendingExamDescription(event.target.value)} rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]" /></div>
            </div>
            <div className="mt-4 flex justify-end"><Button type="button" onClick={() => void saveExamDetails()} isLoading={isSaving}>Simpan Detail Ujian</Button></div>
          </div>
        )}

        {!isPrincipal ? <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-[var(--foreground)]">Pembangun Soal</h3>{!selectedExamId && <p className="mt-1 text-sm text-amber-700">Pilih ujian terlebih dahulu untuk membuat atau menyimpan soal.</p>}{selectedExam?.approvalStatus === 'approved' && <p className="mt-1 text-sm text-amber-700">Ujian disetujui. Daftar soal hanya dapat dilihat.</p>}</div><Button type="button" variant="secondary" disabled={!selectedExamId || selectedExam?.approvalStatus === 'approved'} onClick={() => setShowGenerateQuestionsModal(true)}>Buat Soal dengan AI</Button></div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Jenis Soal</label>
                <select
                  value={questionForm.type}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, type: event.target.value as 'essay' | 'multiple_choice' }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                >
                  <option value="essay">Essay</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Teks Soal</label>
                <textarea
                  ref={questionTextRef}
                  value={questionForm.questionText}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, questionText: event.target.value }))}
                  rows={4}
                  className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  placeholder="Type your question..."
                />
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">Quick Math Insert:</p>
                  <div className="flex flex-wrap gap-2">
                    {MATH_EXPRESSIONS.map((expr) => (
                      <button
                        key={expr.label}
                        type="button"
                        onClick={() => insertMathExpression('question', expr.latex)}
                        title={expr.label}
                        className="rounded bg-[var(--background)] px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-blue-600 hover:text-white"
                      >
                        {expr.display}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted)]">Or manually wrap math with <code className="bg-[var(--background)] px-1">$...$</code></p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Question Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setQuestionForm((prev) => ({ ...prev, questionImage: file }));
                  }}
                  className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                {(questionForm.questionImage || existingQuestionImageUrl) && (
                  <img
                    src={questionForm.questionImage ? URL.createObjectURL(questionForm.questionImage) : existingQuestionImageUrl || undefined}
                    alt="Question preview"
                    className="mt-2 max-h-40 rounded border border-[var(--border)] object-contain"
                  />
                )}
              </div>

              {questionForm.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className={`space-y-2 rounded-lg border p-3 transition-colors ${questionForm.correctOptionIndex === index ? 'border-green-300 bg-green-50' : 'border-dashed border-[var(--border)] bg-[var(--background)]'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-[var(--foreground)]">Option {index + 1}</label>
                        <button
                          type="button"
                          className={`rounded border px-2 py-1 text-xs transition-colors ${questionForm.correctOptionIndex === index ? 'border-green-600 bg-green-600 text-white' : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:bg-slate-200'}`}
                          onClick={() => setQuestionForm((prev) => ({ ...prev, correctOptionIndex: index }))}
                        >
                          {questionForm.correctOptionIndex === index ? 'Correct' : 'Mark correct'}
                        </button>
                      </div>
                      <input
                        ref={(el) => {
                          if (el) optionTextsRef.current[index] = el;
                        }}
                        value={index === 0 ? questionForm.optionText1 : index === 1 ? questionForm.optionText2 : index === 2 ? questionForm.optionText3 : questionForm.optionText4}
                        onChange={(event) => setQuestionForm((prev) => ({
                          ...prev,
                          ...(index === 0 ? { optionText1: event.target.value } : index === 1 ? { optionText2: event.target.value } : index === 2 ? { optionText3: event.target.value } : { optionText4: event.target.value }),
                        }))}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                        placeholder="Option text (use quick math buttons)"
                      />
                      <div className="flex flex-wrap gap-1">
                        {MATH_EXPRESSIONS.slice(0, 6).map((expr) => (
                          <button
                            key={expr.label}
                            type="button"
                            onClick={() => insertMathExpression('option', expr.latex, index)}
                            title={expr.label}
                            className="rounded bg-[var(--background)] px-1.5 py-0.5 text-xs text-[var(--foreground)] hover:bg-blue-600 hover:text-white"
                          >
                            {expr.display}
                          </button>
                        ))}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setQuestionForm((prev) => {
                            const nextOptionImages = [...prev.optionImages];
                            nextOptionImages[index] = file;
                            return { ...prev, optionImages: nextOptionImages };
                          });
                        }}
                        className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-slate-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                      />
                      {(questionForm.optionImages[index] || existingOptionImageUrls[index]) && (
                        <img
                          src={questionForm.optionImages[index] ? URL.createObjectURL(questionForm.optionImages[index] as File) : existingOptionImageUrls[index] || undefined}
                          alt={`Option ${index + 1} preview`}
                          className="max-h-32 rounded border border-[var(--border)] object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Points"
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, points: Number(event.target.value) || 1 }))}
                />
              </div>

              {questionForm.type === 'essay' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Answer Key</label>
                  <textarea
                    value={questionForm.answer}
                    onChange={(event) => setQuestionForm((prev) => ({ ...prev, answer: event.target.value }))}
                    rows={3}
                    className="h-20 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                    placeholder="Enter the model/expected answer for this essay question"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-[var(--muted)]">Quick Math:</span>
                    {MATH_EXPRESSIONS.map((expr) => (
                      <button
                        key={expr.label}
                        type="button"
                        onClick={() => insertMathExpression('question', expr.latex)}
                        title={expr.label}
                        className="rounded bg-[var(--background)] px-1.5 py-0.5 text-xs text-[var(--foreground)] hover:bg-blue-600 hover:text-white"
                      >
                        {expr.display}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {editingQuestionId && (
                  <Button type="button" variant="secondary" onClick={resetQuestionForm}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="button" onClick={() => void createQuestion()} isLoading={isSaving} disabled={!selectedExamId || selectedExam?.approvalStatus === 'approved'}>
                  {editingQuestionId ? 'Update Question' : 'Save Question'}
                </Button>
              </div>
            </div>
          </div></div> : null}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Daftar Soal</h3>
            {questions.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Belum ada pertanyaan.</div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id || index}
                    className="cursor-pointer rounded-lg border border-[var(--border)] p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                    onClick={() => {
                      if (selectedExam?.approvalStatus === 'approved') {
                        setAlert({ type: 'error', message: 'Ujian disetujui dan daftar soal hanya dapat dilihat.' });
                        return;
                      }
                      populateQuestionForm(question);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (selectedExam?.approvalStatus !== 'approved') populateQuestionForm(question);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">{question.type === 'multiple_choice' ? 'Multiple Choice' : 'Essay'}</div>
                      <div className="text-xs text-[var(--muted)]">{question.points ?? 1} pts</div>
                    </div>
                    {question.questionText && (
                    <div className="text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: renderMathText(question.questionText) }} />
                  )}
                    {question.questionImageUrl && (
                      <img src={question.questionImageUrl} alt="Question illustration" className="mt-3 max-h-64 rounded border border-[var(--border)] object-contain" />
                    )}
                    {Array.isArray(question.options) && question.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option: any, optionIndex: number) => (
                          <div key={`${question.id}-option-${optionIndex}`} className="flex items-start gap-2 rounded border border-[var(--border)] bg-[var(--background)] p-2 text-sm">
                            <span className="mt-0.5 font-medium text-[var(--muted)]">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option.imageUrl ? <img src={option.imageUrl} alt="Answer option" className="max-h-24 rounded object-contain" /> : null}
                            {option.text ? <span dangerouslySetInnerHTML={{ __html: renderMathText(option.text) }} /> : null}
                            {question.correctOptionIndex === optionIndex && <span className="ml-auto text-xs font-semibold text-green-600">Correct</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.answer && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Answer:</p>
                        <div className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                          {question.type === 'multiple_choice' ? (
                            <span>Option {question.answer}</span>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: renderMathText(question.answer) }} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </AppShell>
  );
}
