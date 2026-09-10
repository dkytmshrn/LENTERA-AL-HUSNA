"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const crypto_1 = require("crypto");
const account_model_1 = require("../models/account.model");
const registration_request_model_1 = require("../models/registration-request.model");
const curriculum_model_1 = require("../models/curriculum.model");
const curriculum_detail_model_1 = require("../models/curriculum-detail.model");
const classroom_model_1 = require("../models/classroom.model");
const password_util_1 = require("../utils/password.util");
const badge_utils_1 = require("../utils/badge.utils");
const email_service_1 = require("./email.service");
const gcs_service_1 = require("./gcs.service");
const dotenv = __importStar(require("dotenv"));
const pdfkit_1 = __importDefault(require("pdfkit"));
dotenv.config();
let AuthService = class AuthService {
    sequelize;
    jwtService;
    emailService;
    gcsService;
    constructor(sequelize, jwtService, emailService, gcsService) {
        this.sequelize = sequelize;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.gcsService = gcsService;
    }
    getImageExtension(mimeType) {
        if (mimeType === 'image/jpeg')
            return 'jpg';
        if (mimeType === 'image/webp')
            return 'webp';
        if (mimeType === 'image/gif')
            return 'gif';
        return 'png';
    }
    normalizeQuestionPoints(value) {
        const points = Number(value);
        return Number.isFinite(points) && points > 0 ? Math.max(1, Math.round(points)) : 1;
    }
    getExtensionFromStoredUrl(url) {
        const extension = url?.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase();
        return extension === 'jpg' || extension === 'jpeg' ? 'jpg' : extension === 'webp' ? 'webp' : extension === 'gif' ? 'gif' : 'png';
    }
    shuffleIndices(length, seed) {
        const indices = Array.from({ length }, (_, index) => index);
        let value = Array.from(seed).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
        for (let index = indices.length - 1; index > 0; index -= 1) {
            value = (value * 1664525 + 1013904223) | 0;
            const swapIndex = Math.abs(value) % (index + 1);
            [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
        }
        return indices;
    }
    getResendDelayMs(attemptCount) {
        const delays = [60000, 120000, 300000, 600000, 3600000, 7200000];
        return delays[Math.min(Math.max(attemptCount, 0), delays.length - 1)];
    }
    getModelValue(record, key) {
        if (!record) {
            return undefined;
        }
        if (typeof record.getDataValue === 'function') {
            return record.getDataValue(key);
        }
        return record[key];
    }
    async getPendingRegistrationRequestByEmail(email) {
        const requests = await registration_request_model_1.RegistrationRequest.findAll({
            where: {
                email,
                status: registration_request_model_1.RegistrationStatus.PENDING,
            },
            order: [['createdAt', 'DESC']],
        });
        if (!requests.length) {
            return null;
        }
        const validLatestRequest = requests.find((request) => {
            const verificationCode = this.getModelValue(request, 'verificationCode');
            return typeof verificationCode === 'string' && verificationCode.trim().length > 0;
        });
        return validLatestRequest ?? null;
    }
    async pruneDuplicatePendingRegistrationRequests(email, keepRequestId, transaction) {
        const pendingRequests = await registration_request_model_1.RegistrationRequest.findAll({
            where: {
                email,
                status: registration_request_model_1.RegistrationStatus.PENDING,
            },
            attributes: ['id'],
            order: [['createdAt', 'DESC']],
        });
        if (pendingRequests.length <= 1) {
            return;
        }
        const idsToDelete = pendingRequests
            .map((request) => request.id)
            .filter((id) => id !== keepRequestId);
        if (idsToDelete.length > 0) {
            await registration_request_model_1.RegistrationRequest.destroy({
                where: {
                    id: {
                        [sequelize_1.Op.in]: idsToDelete,
                    },
                },
                ...(transaction ? { transaction } : {}),
            });
        }
    }
    async getRegistrationRequestsForAdmin() {
        const requests = await registration_request_model_1.RegistrationRequest.findAll({
            order: [['createdAt', 'DESC']],
        });
        return requests.map((request) => {
            const plain = request.toJSON ? request.toJSON() : { ...request };
            const { verificationCode, ...safeRequest } = plain;
            return safeRequest;
        });
    }
    async getAdminDashboardStats() {
        const now = new Date();
        const [totalUsers, activeUsers, onlineUsers, pendingRegistrations, totalSubjects, totalExaminations, approvedExaminations, totalAttempts, submittedAttempts] = await Promise.all([
            account_model_1.Account.count(),
            account_model_1.Account.count({ where: { status: account_model_1.AccountStatus.ACTIVE } }),
            account_model_1.Account.count({ where: { status: account_model_1.AccountStatus.ACTIVE, refreshToken: { [sequelize_1.Op.ne]: null }, refreshTokenExpiresAt: { [sequelize_1.Op.gt]: now } } }),
            registration_request_model_1.RegistrationRequest.count({ where: { status: registration_request_model_1.RegistrationStatus.PENDING } }),
            curriculum_model_1.Curriculum.count(),
            curriculum_detail_model_1.CurriculumExamination.count(),
            curriculum_detail_model_1.CurriculumExamination.count({ where: { approvalStatus: 'approved' } }),
            curriculum_detail_model_1.ExaminationAttempt.count(),
            curriculum_detail_model_1.ExaminationAttempt.count({ where: { status: 'submitted' } }),
        ]);
        const roleRows = await account_model_1.Account.findAll({
            attributes: ['role', [sequelize_typescript_1.Sequelize.fn('COUNT', sequelize_typescript_1.Sequelize.col('id')), 'count']],
            group: ['role'],
            raw: true,
        });
        return {
            generatedAt: now.toISOString(),
            users: { total: totalUsers, active: activeUsers, online: onlineUsers },
            pendingRegistrations,
            subjects: totalSubjects,
            examinations: { total: totalExaminations, approved: approvedExaminations },
            attempts: { total: totalAttempts, submitted: submittedAttempts, inProgress: totalAttempts - submittedAttempts },
            usersByRole: roleRows.reduce((result, row) => {
                result[row.role] = Number(row.count);
                return result;
            }, {}),
        };
    }
    async getPrincipalReportStats() {
        const [students, teachers, classrooms, subjects, examinations, attempts, allClassrooms, allMemberships] = await Promise.all([
            account_model_1.Account.count({ where: { role: account_model_1.AccountRole.STUDENT, status: account_model_1.AccountStatus.ACTIVE } }),
            account_model_1.Account.count({ where: { role: account_model_1.AccountRole.TEACHER, status: account_model_1.AccountStatus.ACTIVE } }),
            classroom_model_1.Classroom.count(),
            curriculum_model_1.Curriculum.count(),
            curriculum_detail_model_1.CurriculumExamination.count({ where: { approvalStatus: 'approved' } }),
            curriculum_detail_model_1.ExaminationAttempt.findAll({ where: { status: 'submitted' }, attributes: ['score', 'rawScore', 'maxScore'] }),
            classroom_model_1.Classroom.findAll({ order: [['gradeLevel', 'ASC'], ['classCode', 'ASC']] }),
            classroom_model_1.ClassroomStudent.findAll(),
        ]);
        const scores = attempts.map((attempt) => Number(attempt.score || 0)).filter((score) => Number.isFinite(score));
        const averageScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0;
        const passed = scores.filter((score) => score >= 75).length;
        const studentClassroom = new Map(allMemberships.map((membership) => [membership.studentId, membership.classroomId]));
        const submittedAttempts = await curriculum_detail_model_1.ExaminationAttempt.findAll({ where: { status: 'submitted' } });
        const attemptStudentIds = submittedAttempts.map((attempt) => attempt.studentId);
        const examIds = submittedAttempts.map((attempt) => attempt.examinationId);
        const reportExams = examIds.length ? await curriculum_detail_model_1.CurriculumExamination.findAll({ where: { id: { [sequelize_1.Op.in]: examIds } } }) : [];
        const examMap = new Map(reportExams.map((exam) => [exam.id, exam]));
        const curriculumIds = reportExams.map((exam) => exam.curriculumId);
        const reportCurriculums = curriculumIds.length ? await curriculum_model_1.Curriculum.findAll({ where: { id: { [sequelize_1.Op.in]: curriculumIds } } }) : [];
        const curriculumMap = new Map(reportCurriculums.map((curriculum) => [curriculum.id, curriculum]));
        const classStats = allClassrooms.map((classroom) => {
            const classAttempts = submittedAttempts.filter((attempt) => studentClassroom.get(attempt.studentId) === classroom.id);
            const classScores = classAttempts.map((attempt) => Number(attempt.score || 0));
            const average = classScores.length ? Number((classScores.reduce((sum, score) => sum + score, 0) / classScores.length).toFixed(2)) : 0;
            return { id: classroom.id, label: `Tingkat ${classroom.gradeLevel}-${classroom.classCode}`, academicPeriod: classroom.academicPeriod, submittedAttempts: classAttempts.length, averageScore: average, passRate: classAttempts.length ? Number(((classScores.filter((score) => score >= 75).length / classAttempts.length) * 100).toFixed(2)) : 0 };
        }).sort((left, right) => right.averageScore - left.averageScore);
        const subjectStatsMap = new Map();
        for (const attempt of submittedAttempts) {
            const exam = examMap.get(attempt.examinationId);
            const curriculum = exam ? curriculumMap.get(exam.curriculumId) : undefined;
            if (!curriculum)
                continue;
            const current = subjectStatsMap.get(curriculum.id) || { subjectName: curriculum.subjectName, scores: [] };
            current.scores.push(Number(attempt.score || 0));
            subjectStatsMap.set(curriculum.id, current);
        }
        const subjectStats = Array.from(subjectStatsMap.values()).map((item) => ({ subjectName: item.subjectName, averageScore: Number((item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length).toFixed(2)), attempts: item.scores.length })).sort((left, right) => right.averageScore - left.averageScore);
        return {
            organization: { students, teachers, classrooms, subjects, approvedExaminations: examinations },
            performance: { submittedAttempts: attempts.length, averageScore, passed, failed: Math.max(0, attempts.length - passed), passRate: attempts.length ? Number(((passed / attempts.length) * 100).toFixed(2)) : 0, classStats, subjectStats, mostSuccessfulClass: classStats[0] || null, mostSuccessfulSubject: subjectStats[0] || null },
        };
    }
    async getTeacherAssignmentOptions() {
        return (await account_model_1.Account.findAll({ where: { role: account_model_1.AccountRole.TEACHER }, order: [['fullName', 'ASC']] }))
            .map((teacher) => ({ id: teacher.id, name: teacher.name, fullName: teacher.fullName, email: teacher.email, role: teacher.role }));
    }
    async generateExaminationQuestions(body) {
        const multipleChoiceCount = Math.max(0, Math.min(20, Number(body.multipleChoiceCount || 0)));
        const essayCount = Math.max(0, Math.min(20, Number(body.essayCount || 0)));
        if (multipleChoiceCount + essayCount < 1)
            throw new common_1.BadRequestException('Minimal satu soal harus dibuat');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new common_1.ConflictException('AI pembuat soal belum dikonfigurasi.');
        const prompt = `Buat soal ujian untuk MTs Indonesia. Mata pelajaran: ${body.subjectName || 'umum'}. Tingkat: ${body.gradeLevel || '7'}. Buat ${multipleChoiceCount} soal pilihan ganda dan ${essayCount} soal esai. Balas HANYA JSON valid {"questions":[{"type":"multiple_choice"|"essay","questionText":"...","options":["..."],"correctOptionIndex":0,"answer":"...","points":10}]}. Setiap soal harus memiliki jawaban acuan dan poin.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: 'application/json' } }) });
        if (!response.ok)
            throw new common_1.ConflictException('AI belum dapat membuat soal.');
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
        if (!Array.isArray(parsed.questions))
            throw new common_1.ConflictException('Format soal dari AI tidak valid.');
        return {
            questions: parsed.questions.slice(0, multipleChoiceCount + essayCount).map((question) => ({
                ...question,
                points: this.normalizeQuestionPoints(question.points),
            })),
        };
    }
    async getCurriculumClassrooms(curriculumId) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum)
            throw new common_1.NotFoundException('Curriculum not found');
        const assignments = await classroom_model_1.ClassroomCurriculum.findAll({ where: { curriculumId } });
        const classrooms = await classroom_model_1.Classroom.findAll({ order: [['gradeLevel', 'ASC'], ['classCode', 'ASC']] });
        const assignedIds = new Set(assignments.map((assignment) => assignment.classroomId));
        return classrooms.map((classroom) => ({
            ...classroom.toJSON(),
            assigned: assignedIds.has(classroom.id),
            gradeMatches: String(classroom.gradeLevel) === String(curriculum.gradeLevel),
        }));
    }
    async assignCurriculumToClassrooms(curriculumId, classroomIds) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum)
            throw new common_1.NotFoundException('Curriculum not found');
        const uniqueIds = [...new Set((classroomIds || []).filter(Boolean))];
        const classrooms = uniqueIds.length ? await classroom_model_1.Classroom.findAll({ where: { id: { [sequelize_1.Op.in]: uniqueIds } } }) : [];
        if (classrooms.some((classroom) => String(classroom.gradeLevel) !== String(curriculum.gradeLevel))) {
            throw new common_1.BadRequestException('Curriculum and classroom grade levels must match');
        }
        await classroom_model_1.ClassroomCurriculum.destroy({ where: { curriculumId } });
        if (classrooms.length) {
            await classroom_model_1.ClassroomCurriculum.bulkCreate(classrooms.map((classroom) => ({ classroomId: classroom.id, curriculumId })));
        }
        return this.getCurriculumClassrooms(curriculumId);
    }
    async getStudentDashboard(studentId) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const membership = await classroom_model_1.ClassroomStudent.findOne({ where: { studentId } });
        if (!membership)
            return { classroom: null, upcomingExaminations: [], todayAgenda: [], assignedSubjects: [], subjectAgenda: [] };
        const classroom = await classroom_model_1.Classroom.findByPk(membership.classroomId);
        const assignments = await classroom_model_1.ClassroomCurriculum.findAll({ where: { classroomId: membership.classroomId } });
        const curriculumIds = assignments.map((assignment) => assignment.curriculumId);
        const curriculums = curriculumIds.length ? await curriculum_model_1.Curriculum.findAll({ where: { id: { [sequelize_1.Op.in]: curriculumIds } } }) : [];
        const examinations = curriculumIds.length ? await curriculum_detail_model_1.CurriculumExamination.findAll({ where: { curriculumId: { [sequelize_1.Op.in]: curriculumIds }, approvalStatus: 'approved' }, order: [['examDate', 'ASC'], ['examStartTime', 'ASC']] }) : [];
        const attempts = examinations.length ? await curriculum_detail_model_1.ExaminationAttempt.findAll({ where: { studentId, examinationId: { [sequelize_1.Op.in]: examinations.map((exam) => exam.id) } } }) : [];
        const attemptedExamIds = new Set(attempts.map((attempt) => attempt.examinationId));
        const lessons = curriculumIds.length ? await curriculum_detail_model_1.CurriculumLesson.findAll({ where: { curriculumId: { [sequelize_1.Op.in]: curriculumIds } }, order: [['week', 'ASC'], ['createdAt', 'ASC']] }) : [];
        const now = Date.now();
        const upcomingExaminations = examinations.filter((exam) => {
            if (attemptedExamIds.has(exam.id))
                return false;
            try {
                return this.getExamWindow(exam).end.getTime() > now;
            }
            catch {
                return false;
            }
        }).slice(0, 10);
        return {
            classroom: classroom ? { id: classroom.id, gradeLevel: classroom.gradeLevel, classCode: classroom.classCode, academicPeriod: classroom.academicPeriod } : null,
            assignedSubjects: curriculums.map((curriculum) => ({ id: curriculum.id, subjectName: curriculum.subjectName, gradeLevel: curriculum.gradeLevel })),
            upcomingExaminations,
            todayAgenda: lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, description: lesson.description, week: lesson.week, subjectName: curriculums.find((curriculum) => curriculum.id === lesson.curriculumId)?.subjectName })),
            subjectAgenda: await Promise.all(curriculums.map(async (curriculum) => ({
                id: curriculum.id,
                subjectName: curriculum.subjectName,
                gradeLevel: curriculum.gradeLevel,
                lessons: await Promise.all(lessons.filter((lesson) => lesson.curriculumId === curriculum.id).map(async (lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    week: lesson.week,
                    source: lesson.source,
                    previewUrl: lesson.fileId ? await this.gcsService.getSignedUrl(lesson.fileId, 'lessons', 'pdf', 1) : undefined,
                }))),
            }))),
        };
    }
    async generateLessonPractice(lessonId, studentId) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const lesson = await curriculum_detail_model_1.CurriculumLesson.findByPk(lessonId);
        if (!lesson)
            throw new common_1.NotFoundException('Lesson not found');
        const membership = await classroom_model_1.ClassroomStudent.findOne({ where: { studentId } });
        if (!membership || !(await classroom_model_1.ClassroomCurriculum.findOne({ where: { classroomId: membership.classroomId, curriculumId: lesson.curriculumId } }))) {
            throw new common_1.UnauthorizedException('You are not assigned to this subject');
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new common_1.ConflictException('AI latihan belum dikonfigurasi.');
        const prompt = `Buat latihan belajar untuk siswa MTs Indonesia berdasarkan materi berikut. Buat 5 sampai 10 soal campuran pilihan ganda dan esai. Jangan simpan latihan ini.\nJudul materi: ${lesson.title}\nDeskripsi: ${lesson.description || ''}\nSumber: ${lesson.source || 'PDF'}\nBalas HANYA JSON valid: {"questions":[{"type":"multiple_choice"|"essay","questionText":"...","options":["..."],"correctOptionIndex":0,"answer":"...","points":10}]}. Setiap soal harus memiliki poin dan jawaban acuan.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } }) });
        if (!response.ok)
            throw new common_1.ConflictException('AI belum dapat membuat latihan. Silakan coba lagi.');
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
        if (!Array.isArray(parsed.questions) || parsed.questions.length < 5)
            throw new common_1.ConflictException('AI menghasilkan latihan yang tidak lengkap.');
        return { lesson: { id: lesson.id, title: lesson.title }, questions: parsed.questions.slice(0, 10) };
    }
    async gradeLessonPractice(questions, answers) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new common_1.ConflictException('AI penilaian belum dikonfigurasi.');
        const safeQuestions = questions.slice(0, 10).map((question, index) => ({
            index,
            type: question.type,
            questionText: String(question.questionText || '').slice(0, 4000),
            options: Array.isArray(question.options) ? question.options.map((option) => String(option).slice(0, 500)) : [],
            correctOptionIndex: question.correctOptionIndex,
            answer: String(question.answer || '').slice(0, 2000),
            points: Number(question.points || 10),
            studentAnswer: String(answers[index] || '').slice(0, 4000),
        }));
        const prompt = `Anda adalah guru yang menilai latihan siswa MTs. Nilai pilihan ganda dan esai berdasarkan makna sebenarnya, bukan pencocokan string. Untuk esai, jawaban dengan notasi atau urutan berbeda tetap benar jika makna matematis/faktualnya setara. Gunakan jawaban acuan, pertanyaan, dan opsi sebagai konteks. Berikan persentase kecocokan makna 0-100 untuk setiap soal dan hitung awardedPoints = points * percentage / 100. Jangan menilai jawaban kosong sebagai benar. Balas HANYA JSON valid: {"results":[{"index":0,"correct":true,"matchPercentage":100,"awardedPoints":10,"explanation":"..."}]}. Data latihan:\n${JSON.stringify(safeQuestions)}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }) });
        if (!response.ok)
            throw new common_1.ConflictException('AI belum dapat memeriksa jawaban latihan.');
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
        if (!Array.isArray(parsed.results) || parsed.results.length !== safeQuestions.length)
            throw new common_1.ConflictException('Hasil penilaian AI tidak lengkap.');
        const results = parsed.results.map((result, index) => {
            const points = Number(safeQuestions[index].points || 10);
            const matchPercentage = Math.max(0, Math.min(100, Number(result.matchPercentage) || 0));
            return { correct: matchPercentage >= 75, matchPercentage, awardedPoints: Number((points * matchPercentage / 100).toFixed(2)), maxPoints: points, explanation: String(result.explanation || 'Periksa kembali materi pelajaran.') };
        });
        const score = results.reduce((total, result) => total + result.awardedPoints, 0);
        const maxScore = results.reduce((total, result) => total + result.maxPoints, 0);
        return { score, maxScore, percentage: maxScore ? Number((score / maxScore * 100).toFixed(2)) : 0, results };
    }
    async getUsersForAdmin(options = {}) {
        const hasPagination = typeof options.page === 'number' || typeof options.limit === 'number';
        const page = Math.max(1, Number(options.page || 1));
        const limit = Math.max(1, Number(options.limit || 20));
        const where = {};
        if (options.role) {
            where.role = options.role;
        }
        if (options.searchEmail?.trim()) {
            where.email = { [sequelize_1.Op.iLike]: `%${options.searchEmail.trim()}%` };
        }
        if (options.searchName?.trim()) {
            where[sequelize_1.Op.or] = [
                { fullName: { [sequelize_1.Op.iLike]: `%${options.searchName.trim()}%` } },
                { name: { [sequelize_1.Op.iLike]: `%${options.searchName.trim()}%` } },
            ];
        }
        if (options.search && options.search.trim()) {
            const search = options.search.trim();
            where[sequelize_1.Op.or] = [
                { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { fullName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const allUsersOrder = [
            [sequelize_typescript_1.Sequelize.literal('LOWER("fullName")'), 'ASC'],
            [sequelize_typescript_1.Sequelize.literal('LOWER("name")'), 'ASC'],
            ['email', 'ASC'],
        ];
        if (!hasPagination) {
            const users = await account_model_1.Account.findAll({
                where,
                order: allUsersOrder,
            });
            return users.map((user) => {
                const plain = user.toJSON ? user.toJSON() : { ...user };
                const { password, passwordResetToken, passwordResetExpires, ...safeUser } = plain;
                return safeUser;
            });
        }
        const { rows, count } = await account_model_1.Account.findAndCountAll({
            where,
            order: allUsersOrder,
            limit,
            offset: (page - 1) * limit,
        });
        const items = rows.map((user) => {
            const plain = user.toJSON ? user.toJSON() : { ...user };
            const { password, passwordResetToken, passwordResetExpires, ...safeUser } = plain;
            return safeUser;
        });
        return {
            items,
            totalCount: count,
            totalPages: Math.max(1, Math.ceil(count / limit)),
            page,
            limit,
        };
    }
    normalizeTeacherIdsList(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return [...new Set(value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
        }
        return [...new Set(String(value)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean))];
    }
    buildTeacherMetadata(teacherIds) {
        if (!teacherIds.length) {
            return { teacherIds: '', teacherNames: '' };
        }
        return {
            teacherIds: teacherIds.join(','),
            teacherNames: teacherIds
                .map((id) => id.trim())
                .filter(Boolean)
                .join(','),
        };
    }
    async assertTeacherCurriculumAccess(curriculumId, userId, role) {
        if (role !== account_model_1.AccountRole.TEACHER)
            return;
        if (!userId)
            throw new common_1.UnauthorizedException('Authenticated teacher is required');
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum)
            throw new common_1.NotFoundException('Curriculum not found');
        const teacherIds = this.normalizeTeacherIdsList(curriculum.teacherIds);
        if (!teacherIds.includes(userId)) {
            throw new common_1.UnauthorizedException('You are not assigned to this subject');
        }
    }
    getExamWindow(exam) {
        if (!exam.examDate || !exam.examStartTime || !exam.examEndTime) {
            throw new common_1.BadRequestException('Examination date, start time, and end time must be configured');
        }
        const start = new Date(`${exam.examDate}T${exam.examStartTime}`);
        const end = new Date(`${exam.examDate}T${exam.examEndTime}`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            throw new common_1.BadRequestException('Examination time window is invalid');
        }
        return { start, end };
    }
    validateExamSchedule(examDate, startTime, endTime) {
        if (!examDate || !startTime || !endTime)
            return;
        const start = new Date(`${examDate}T${startTime}`);
        const end = new Date(`${examDate}T${endTime}`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            throw new common_1.BadRequestException('Waktu selesai ujian harus setelah waktu mulai');
        }
    }
    isExamPast(exam) {
        try {
            return this.getExamWindow(exam).end.getTime() <= Date.now();
        }
        catch {
            return false;
        }
    }
    async assertExamEditable(examId) {
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam)
            throw new common_1.NotFoundException('Examination not found');
        if (exam.approvalStatus === 'approved')
            throw new common_1.ConflictException('Approved examinations are locked and cannot be changed');
        return exam;
    }
    async approveExamination(examId, approverId) {
        const exam = await this.assertExamEditable(examId);
        this.getExamWindow(exam);
        if (await curriculum_detail_model_1.ExaminationQuestion.count({ where: { examinationId: examId } }) === 0) {
            throw new common_1.BadRequestException('At least one question is required before approval');
        }
        await exam.update({ approvalStatus: 'approved', approvedAt: new Date(), approvedBy: approverId });
        return exam;
    }
    async unlockExamination(examId) {
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam)
            throw new common_1.NotFoundException('Examination not found');
        if (exam.approvalStatus !== 'approved') {
            throw new common_1.ConflictException('Examination is already unlocked');
        }
        await exam.update({ approvalStatus: 'draft', approvedAt: undefined, approvedBy: undefined });
        return exam;
    }
    getStudentExamAvailability(exam) {
        try {
            const { start, end } = this.getExamWindow(exam);
            const now = Date.now();
            if (now < start.getTime() - 10 * 60 * 1000)
                return 'upcoming';
            if (now <= end.getTime())
                return 'open';
            return 'passed';
        }
        catch {
            return 'unavailable';
        }
    }
    async getStudentExaminations(studentId) {
        const exams = await curriculum_detail_model_1.CurriculumExamination.findAll({ where: { approvalStatus: 'approved' }, order: [['examDate', 'ASC'], ['examStartTime', 'ASC']] });
        const attempts = studentId ? await curriculum_detail_model_1.ExaminationAttempt.findAll({ where: { studentId } }) : [];
        const examById = new Map(exams.map((exam) => [exam.id, exam]));
        for (const attempt of attempts) {
            const exam = examById.get(attempt.examinationId);
            if (attempt.status === 'in_progress' && exam && Date.now() > this.getExamWindow(exam).end.getTime()) {
                await attempt.update({ status: 'expired', submittedAt: new Date() });
            }
        }
        const attemptMap = new Map(attempts.map((attempt) => [attempt.examinationId, attempt]));
        return exams.map((exam) => {
            const attempt = attemptMap.get(exam.id);
            return { ...exam.toJSON(), availability: attempt?.status === 'submitted' || attempt?.status === 'expired' ? 'completed' : attempt?.status === 'in_progress' ? 'in_progress' : this.getStudentExamAvailability(exam), attempt: attempt ? attempt.toJSON() : undefined };
        });
    }
    async startStudentExamination(examId, studentId) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const exam = await curriculum_detail_model_1.CurriculumExamination.findOne({ where: { id: examId, approvalStatus: 'approved' } });
        if (!exam)
            throw new common_1.NotFoundException('Approved examination not found');
        const { start, end } = this.getExamWindow(exam);
        const now = Date.now();
        if (now < start.getTime() - 10 * 60 * 1000)
            throw new common_1.ConflictException('This examination is not open yet');
        if (now > end.getTime())
            throw new common_1.ConflictException('This examination has ended');
        if (now < start.getTime())
            return { exam: exam.toJSON(), lounge: true, startAt: start.toISOString(), endAt: end.toISOString() };
        let attempt = await curriculum_detail_model_1.ExaminationAttempt.findOne({ where: { examinationId: examId, studentId } });
        if (attempt && attempt.status !== 'in_progress')
            throw new common_1.ConflictException('You have already taken this examination');
        if (!attempt)
            attempt = await curriculum_detail_model_1.ExaminationAttempt.create({ examinationId: examId, studentId, status: 'in_progress', answers: {}, startedAt: new Date(), questionResults: {}, gradingStatus: 'complete', questionOrder: {} });
        const questions = await curriculum_detail_model_1.ExaminationQuestion.findAll({ where: { examinationId: examId }, order: [['createdAt', 'ASC']] });
        let questionOrder = attempt.questionOrder || {};
        if (!questionOrder.questionIds?.length) {
            const questionIds = this.shuffleIndices(questions.length, `${studentId}:${examId}`).map((index) => questions[index].id);
            const optionOrders = {};
            questions.forEach((question) => {
                const options = typeof question.options === 'string' ? JSON.parse(question.options || '[]') : question.options || [];
                optionOrders[question.id] = this.shuffleIndices(options.length, `${studentId}:${question.id}`);
            });
            questionOrder = { questionIds, optionOrders };
            await attempt.update({ questionOrder });
        }
        const questionMap = new Map(questions.map((question) => [question.id, question]));
        const liveQuestions = await Promise.all((questionOrder.questionIds || questions.map((question) => question.id)).map(async (questionId) => {
            const question = questionMap.get(questionId);
            if (!question)
                return null;
            const raw = question.toJSON();
            const options = typeof raw.options === 'string' ? JSON.parse(raw.options || '[]') : raw.options || [];
            const optionOrder = questionOrder.optionOrders?.[raw.id] || options.map((_, index) => index);
            return { id: raw.id, type: raw.type, questionText: raw.questionText, questionImageUrl: raw.questionImageFileId ? await this.gcsService.getSignedUrl(raw.questionImageFileId, 'exam-questions', raw.questionImageExtension || this.getExtensionFromStoredUrl(raw.questionImageUrl), 24) : raw.questionImageUrl, options: await Promise.all(optionOrder.map((index) => options[index]).map(async (option) => ({ text: option.text, imageUrl: option.imageFileId ? await this.gcsService.getSignedUrl(option.imageFileId, 'exam-questions', option.imageExtension || 'png', 24) : option.imageUrl }))), points: raw.points };
        }));
        return { exam: exam.toJSON(), attempt: { ...attempt.toJSON(), questionOrder }, endAt: end.toISOString(), questions: liveQuestions.filter(Boolean) };
    }
    async saveStudentAnswers(examId, studentId, answers) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const attempt = await curriculum_detail_model_1.ExaminationAttempt.findOne({ where: { examinationId: examId, studentId, status: 'in_progress' } });
        if (!attempt)
            throw new common_1.NotFoundException('Active examination attempt not found');
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam)
            throw new common_1.NotFoundException('Examination not found');
        if (Date.now() > this.getExamWindow(exam).end.getTime())
            throw new common_1.ConflictException('Examination time has ended');
        await attempt.update({ answers: { ...(attempt.answers || {}), ...answers } });
        return attempt;
    }
    async submitStudentExamination(examId, studentId) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const attempt = await curriculum_detail_model_1.ExaminationAttempt.findOne({ where: { examinationId: examId, studentId, status: 'in_progress' } });
        if (!attempt)
            throw new common_1.NotFoundException('Active examination attempt not found');
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam)
            throw new common_1.NotFoundException('Examination not found');
        if (Date.now() > this.getExamWindow(exam).end.getTime()) {
            await attempt.update({ status: 'expired', submittedAt: new Date() });
            throw new common_1.ConflictException('Examination time has ended');
        }
        const questions = await curriculum_detail_model_1.ExaminationQuestion.findAll({ where: { examinationId: examId } });
        const maxScore = questions.reduce((total, question) => total + Number(question.points || 1), 0);
        const gradedQuestions = await Promise.all(questions.map(async (question) => {
            const points = Number(question.points || 1);
            const studentAnswer = (attempt.answers || {})[question.id];
            if (question.type === 'multiple_choice') {
                const storedOptionOrder = attempt.questionOrder?.optionOrders?.[question.id];
                const optionOrder = Array.isArray(storedOptionOrder) ? storedOptionOrder : [];
                const originalAnswerIndex = optionOrder.length ? optionOrder[Number(studentAnswer)] : Number(studentAnswer);
                const correct = originalAnswerIndex === Number(question.correctOptionIndex);
                return { id: question.id, result: { awardedPoints: correct ? points : 0, maxPoints: points, correct, gradingMethod: 'automatic' } };
            }
            else {
                const essayResult = await this.gradeEssayWithGemini(question, String(studentAnswer || ''), points);
                return { id: question.id, result: essayResult };
            }
        }));
        const rawScore = gradedQuestions.reduce((total, item) => total + Number(item.result.awardedPoints || 0), 0);
        const percentage = maxScore > 0 ? Number(((rawScore / maxScore) * 100).toFixed(2)) : 0;
        const gradingStatus = 'complete';
        const questionResults = Object.fromEntries(gradedQuestions.map((item) => [item.id, item.result]));
        await attempt.update({ status: 'submitted', submittedAt: new Date(), score: percentage, rawScore, maxScore, passed: percentage >= 75, questionResults, gradingStatus });
        return { id: attempt.id, status: attempt.status, score: percentage, rawScore, maxScore, percentage, passed: percentage >= 75, gradingStatus, submittedAt: attempt.submittedAt };
    }
    async gradeEssayWithGemini(question, studentAnswer, maxPoints) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new common_1.ConflictException('Penilaian belum dapat diselesaikan karena GEMINI_API_KEY belum dikonfigurasi. Nilai belum dirilis.');
        }
        const prompt = [
            'Anda adalah penilai esai untuk siswa madrasah tsanawiyah Indonesia.',
            'Nilai apakah jawaban siswa memiliki makna yang sama dengan jawaban acuan. Jangan hanya mencocokkan kata; pahami makna, fakta utama, dan kelengkapan jawaban.',
            `Pertanyaan: ${question.questionText || ''}`,
            `Jawaban acuan: ${question.answer || ''}`,
            `Jawaban siswa: ${studentAnswer}`,
            `Nilai maksimum: ${maxPoints}`,
            'Tentukan matchPercentage berdasarkan kesamaan makna, ketepatan fakta, kelengkapan, dan relevansi jawaban siswa. Jawaban dengan kata berbeda tetapi makna dan fakta yang benar harus mendapat nilai tinggi; jawaban yang hanya menyalin kata tanpa memahami pertanyaan harus mendapat nilai rendah.',
            'Balas HANYA JSON valid dengan format: {"matchPercentage": number, "feedback": string, "confidence": number}. matchPercentage harus antara 0 dan 100, confidence antara 0 dan 1.',
        ].join('\n');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Gemini returned ${response.status}: ${errorBody.slice(0, 300)}`);
            }
            const payload = await response.json();
            const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
            const matchPercentage = Number(parsed.matchPercentage);
            if (!Number.isFinite(matchPercentage) || matchPercentage < 0 || matchPercentage > 100) {
                throw new Error('Gemini returned an invalid matchPercentage');
            }
            const normalizedPercentage = Number(matchPercentage.toFixed(2));
            return { awardedPoints: Number((maxPoints * normalizedPercentage / 100).toFixed(2)), maxPoints, matchPercentage: normalizedPercentage, gradingMethod: 'gemini', status: 'complete', feedback: String(parsed.feedback || ''), confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)) };
        }
        catch (error) {
            console.error('Gemini essay grading failed:', error);
            if (error instanceof common_1.ConflictException)
                throw error;
            throw new common_1.ConflictException('Penilaian Gemini belum selesai. Nilai belum dirilis. Silakan coba kumpulkan kembali setelah layanan AI tersedia.');
        }
    }
    async getStudentReportCard(studentId, gradeLevel) {
        if (!studentId)
            throw new common_1.UnauthorizedException('Authenticated student is required');
        const student = await account_model_1.Account.findByPk(studentId);
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const attempts = await curriculum_detail_model_1.ExaminationAttempt.findAll({ where: { studentId, status: 'submitted' }, order: [['submittedAt', 'DESC']] });
        const exams = attempts.length ? await curriculum_detail_model_1.CurriculumExamination.findAll({ where: { id: { [sequelize_1.Op.in]: attempts.map((attempt) => attempt.examinationId) } } }) : [];
        const curriculums = exams.length ? await curriculum_model_1.Curriculum.findAll({ where: { id: { [sequelize_1.Op.in]: exams.map((exam) => exam.curriculumId) } } }) : [];
        const examMap = new Map(exams.map((exam) => [exam.id, exam]));
        const curriculumMap = new Map(curriculums.map((curriculum) => [curriculum.id, curriculum]));
        const rows = attempts.map((attempt) => {
            const exam = examMap.get(attempt.examinationId);
            const curriculum = exam ? curriculumMap.get(exam.curriculumId) : undefined;
            return { gradeLevel: curriculum?.gradeLevel || '', subjectName: curriculum?.subjectName || 'Mata Pelajaran', examTitle: exam?.title || 'Ujian', score: attempt.score || 0, rawScore: attempt.rawScore || 0, maxScore: attempt.maxScore || 0, gradingStatus: attempt.gradingStatus, submittedAt: attempt.submittedAt };
        }).filter((row) => !gradeLevel || row.gradeLevel === gradeLevel);
        const subjectMap = new Map();
        for (const row of rows) {
            const key = `${row.gradeLevel}:${row.subjectName}`;
            const current = subjectMap.get(key) || { gradeLevel: row.gradeLevel, subjectName: row.subjectName, rawScore: 0, maxScore: 0, score: 0, examinations: [], gradingStatus: 'complete' };
            current.rawScore += Number(row.rawScore);
            current.maxScore += Number(row.maxScore);
            current.examinations.push(row);
            if (row.gradingStatus === 'pending_ai')
                current.gradingStatus = 'pending_ai';
            subjectMap.set(key, current);
        }
        const subjectRows = Array.from(subjectMap.values()).map((row) => ({ ...row, score: row.maxScore ? Number(((row.rawScore / row.maxScore) * 100).toFixed(2)) : 0 }));
        const average = subjectRows.length ? subjectRows.reduce((sum, row) => sum + Number(row.score), 0) / subjectRows.length : 0;
        const availableGrades = [...new Set(rows.map((row) => row.gradeLevel).filter(Boolean))].sort();
        return { student: { id: student.id, name: student.fullName || student.name, email: student.email }, gradeLevel: gradeLevel || null, availableGrades, rows: subjectRows, average: Number(average.toFixed(2)), generatedAt: new Date().toISOString() };
    }
    async generateStudentReportCardPdf(studentId, gradeLevel) {
        const report = await this.getStudentReportCard(studentId, gradeLevel);
        return new Promise((resolve) => {
            const document = new pdfkit_1.default({ size: 'A4', margin: 50 });
            const chunks = [];
            document.on('data', (chunk) => chunks.push(chunk));
            document.on('end', () => resolve(Buffer.concat(chunks)));
            document.circle(306, 58, 18).lineWidth(2).strokeColor('#2563eb').stroke();
            document.fontSize(16).font('Helvetica-Bold').fillColor('#2563eb').text('L', 301, 49);
            document.fontSize(16).font('Helvetica-Bold').text('MTS AL-HUSNA LENTERA', { align: 'center' });
            document.fontSize(12).font('Helvetica').text('LAPORAN HASIL BELAJAR PESERTA DIDIK', { align: 'center' });
            document.moveDown().fontSize(10).text(`Nama Peserta Didik: ${report.student.name}`);
            document.text(`Email: ${report.student.email}`);
            document.text(`Tanggal Cetak: ${new Date(report.generatedAt).toLocaleDateString('id-ID')}`);
            document.moveDown();
            document.font('Helvetica-Bold').text('Rekapitulasi Nilai');
            document.font('Helvetica').text('Mata Pelajaran'.padEnd(28) + 'Ujian'.padEnd(28) + 'Nilai');
            document.text('-'.repeat(72));
            for (const row of report.rows)
                document.text(`${row.subjectName.slice(0, 30).padEnd(32)}${row.score.toFixed(2)}% (${row.rawScore}/${row.maxScore})`);
            document.moveDown().font('Helvetica-Bold').text(`Nilai Rata-rata: ${report.average}`);
            document.font('Helvetica').text('Keterangan: Nilai minimal ketuntasan ditetapkan oleh madrasah.');
            document.end();
        });
    }
    async getCurriculums(userId, role) {
        const curriculums = await curriculum_model_1.Curriculum.findAll({
            order: [['createdAt', 'DESC']],
        });
        return curriculums.filter((curriculum) => {
            if (role !== account_model_1.AccountRole.TEACHER)
                return true;
            return this.normalizeTeacherIdsList(curriculum.teacherIds).includes(userId || '');
        }).map((curriculum) => {
            const plain = curriculum.toJSON ? curriculum.toJSON() : { ...curriculum };
            const teacherIds = this.normalizeTeacherIdsList(plain.teacherIds ?? plain.teacherId ?? []);
            const teacherNames = String(plain.teacherNames ?? plain.teacherName ?? '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return {
                ...plain,
                teacherIds,
                teacherNames,
                teacherId: teacherIds[0] || undefined,
                teacherName: teacherNames[0] || undefined,
            };
        });
    }
    async createCurriculum(body) {
        const subjectName = String(body.subjectName || '').trim();
        const gradeLevel = String(body.gradeLevel || '').trim();
        const year = Number(body.year ?? new Date().getFullYear());
        const normalizedEndYearValue = body.endYear === undefined || body.endYear === null || body.endYear === '' ? null : Number(body.endYear);
        const endYear = Number.isFinite(normalizedEndYearValue) ? normalizedEndYearValue : null;
        if (!subjectName || !gradeLevel || !Number.isFinite(year)) {
            throw new common_1.BadRequestException('Subject name, grade level, and year are required');
        }
        if (endYear !== null && endYear < year) {
            throw new common_1.BadRequestException('End year must be greater than or equal to the start year');
        }
        const teacherIds = this.normalizeTeacherIdsList(body.teacherIds ?? body.teacherId ?? []);
        const uniqueTeacherIds = [...new Set(teacherIds)];
        const teachers = uniqueTeacherIds.length
            ? await account_model_1.Account.findAll({ where: { id: { [sequelize_1.Op.in]: uniqueTeacherIds } } })
            : [];
        const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher]));
        const teacherNames = uniqueTeacherIds
            .map((teacherId) => teacherMap.get(teacherId)?.fullName || teacherMap.get(teacherId)?.name)
            .filter(Boolean);
        const curriculum = await curriculum_model_1.Curriculum.create({
            subjectName,
            gradeLevel,
            year,
            endYear,
            teacherIds: uniqueTeacherIds.join(','),
            teacherNames: teacherNames.join(','),
        });
        const plain = curriculum.toJSON ? curriculum.toJSON() : { ...curriculum };
        const createdTeacherIds = this.normalizeTeacherIdsList(plain.teacherIds ?? plain.teacherId ?? uniqueTeacherIds);
        const createdTeacherNames = String(plain.teacherNames ?? plain.teacherName ?? teacherNames.join(','))
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);
        return {
            ...plain,
            teacherIds: createdTeacherIds,
            teacherNames: createdTeacherNames,
            teacherId: createdTeacherIds[0] || undefined,
            teacherName: createdTeacherNames[0] || undefined,
        };
    }
    async updateCurriculum(id, updateDto) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(id);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        if (updateDto.subjectName !== undefined) {
            curriculum.subjectName = String(updateDto.subjectName).trim();
        }
        if (updateDto.gradeLevel !== undefined) {
            curriculum.gradeLevel = String(updateDto.gradeLevel).trim();
        }
        if (updateDto.year !== undefined) {
            const yearValue = Number(updateDto.year);
            if (!Number.isFinite(yearValue)) {
                throw new common_1.BadRequestException('Year must be a valid number');
            }
            curriculum.year = yearValue;
        }
        if (Object.prototype.hasOwnProperty.call(updateDto, 'endYear')) {
            const value = updateDto.endYear;
            const nextEndYear = value === null || value === undefined || value === '' ? null : Number(value);
            if (nextEndYear !== null && !Number.isFinite(nextEndYear)) {
                throw new common_1.BadRequestException('End year must be a valid number');
            }
            if (nextEndYear !== null && nextEndYear < (Number(curriculum.year) || new Date().getFullYear())) {
                throw new common_1.BadRequestException('End year must be greater than or equal to the start year');
            }
            curriculum.endYear = nextEndYear;
        }
        if (updateDto.teacherIds !== undefined || updateDto.teacherId !== undefined) {
            const teacherIds = this.normalizeTeacherIdsList(updateDto.teacherIds ?? updateDto.teacherId ?? []);
            const uniqueTeacherIds = [...new Set(teacherIds)];
            const teachers = uniqueTeacherIds.length
                ? await account_model_1.Account.findAll({ where: { id: { [sequelize_1.Op.in]: uniqueTeacherIds } } })
                : [];
            const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher]));
            const teacherNames = uniqueTeacherIds
                .map((teacherId) => teacherMap.get(teacherId)?.fullName || teacherMap.get(teacherId)?.name)
                .filter(Boolean);
            curriculum.teacherIds = uniqueTeacherIds.join(',');
            curriculum.teacherNames = teacherNames.join(',');
        }
        await curriculum.save();
        const plain = curriculum.toJSON ? curriculum.toJSON() : { ...curriculum };
        const teacherIds = this.normalizeTeacherIdsList(plain.teacherIds ?? plain.teacherId ?? []);
        const teacherNames = String(plain.teacherNames ?? plain.teacherName ?? '')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);
        return {
            ...plain,
            teacherIds,
            teacherNames,
            teacherId: teacherIds[0] || undefined,
            teacherName: teacherNames[0] || undefined,
        };
    }
    async deleteCurriculum(id) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(id);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        await curriculum_detail_model_1.CurriculumLesson.destroy({ where: { curriculumId: id } });
        await curriculum_detail_model_1.CurriculumExamination.destroy({ where: { curriculumId: id } });
        await curriculum.destroy();
        return { message: 'Curriculum deleted successfully' };
    }
    async getCurriculumLessons(curriculumId, userId, role) {
        await this.assertTeacherCurriculumAccess(curriculumId, userId, role);
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        return curriculum_detail_model_1.CurriculumLesson.findAll({
            where: { curriculumId },
            order: [['createdAt', 'DESC']],
        });
    }
    async createCurriculumLesson(curriculumId, lesson, file) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const title = String(lesson.title || '').trim();
        const source = String(lesson.source || '').trim();
        const weekValue = lesson.week === undefined || lesson.week === null || String(lesson.week).trim() === ''
            ? undefined
            : Number(String(lesson.week).trim());
        if (!title) {
            throw new common_1.BadRequestException('Lesson title is required');
        }
        if (!source && !file) {
            throw new common_1.BadRequestException('Either a YouTube link or a PDF file must be provided');
        }
        if (weekValue !== undefined && (!Number.isInteger(weekValue) || weekValue < 1 || weekValue > 20)) {
            throw new common_1.BadRequestException('Lesson week must be between 1 and 20.');
        }
        const existingLessons = await curriculum_detail_model_1.CurriculumLesson.findAll({ where: { curriculumId } });
        const usedWeeks = existingLessons.reduce((total, item) => {
            const parsed = Number(String(item.week ?? '').trim());
            return total + (Number.isInteger(parsed) && parsed > 0 ? parsed : 0);
        }, 0);
        if (weekValue !== undefined && usedWeeks + weekValue > 20) {
            throw new common_1.BadRequestException(`This curriculum has ${20 - usedWeeks} weeks remaining. The lesson cannot exceed the 20-week limit.`);
        }
        let fileId;
        let fileSizeBytes;
        let originalFileName;
        if (file) {
            if (!file.mimetype || file.mimetype !== 'application/pdf') {
                throw new common_1.BadRequestException('Only PDF files are allowed');
            }
            const uploadResult = await this.gcsService.uploadFile(file.buffer, file.originalname, file.mimetype);
            fileId = uploadResult.fileId;
            fileSizeBytes = uploadResult.fileSizeBytes;
            originalFileName = file.originalname;
        }
        return curriculum_detail_model_1.CurriculumLesson.create({
            curriculumId,
            title,
            source,
            description: lesson.description?.trim() || undefined,
            week: weekValue !== undefined ? String(weekValue) : undefined,
            fileId,
            fileSizeBytes,
            originalFileName,
        });
    }
    async updateCurriculumLesson(curriculumId, lessonId, lesson, file) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const item = await curriculum_detail_model_1.CurriculumLesson.findOne({ where: { id: lessonId, curriculumId } });
        if (!item) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (lesson.title !== undefined) {
            item.title = String(lesson.title).trim();
        }
        if (lesson.source !== undefined) {
            item.source = String(lesson.source).trim() || undefined;
        }
        if (lesson.description !== undefined) {
            item.description = lesson.description?.trim() || undefined;
        }
        if (lesson.week !== undefined) {
            const weekValue = lesson.week === null || String(lesson.week).trim() === ''
                ? undefined
                : Number(String(lesson.week).trim());
            if (weekValue !== undefined && (!Number.isInteger(weekValue) || weekValue < 1 || weekValue > 20)) {
                throw new common_1.BadRequestException('Lesson week must be between 1 and 20.');
            }
            const allLessons = await curriculum_detail_model_1.CurriculumLesson.findAll({ where: { curriculumId } });
            const currentWeek = Number(String(item.week ?? '').trim());
            const usedWeeks = allLessons.reduce((total, lessonItem) => {
                const parsed = Number(String(lessonItem.week ?? '').trim());
                return total + (Number.isInteger(parsed) && parsed > 0 && lessonItem.id !== item.id ? parsed : 0);
            }, 0);
            if (weekValue !== undefined && usedWeeks + weekValue > 20) {
                throw new common_1.BadRequestException(`This curriculum has ${20 - usedWeeks} weeks remaining. The lesson cannot exceed the 20-week limit.`);
            }
            item.week = weekValue !== undefined ? String(weekValue) : undefined;
        }
        if (file) {
            if (!file.mimetype || file.mimetype !== 'application/pdf') {
                throw new common_1.BadRequestException('Only PDF files are allowed');
            }
            if (item.fileId) {
                await this.gcsService.deleteFile(item.fileId);
            }
            const uploadResult = await this.gcsService.uploadFile(file.buffer, file.originalname, file.mimetype);
            item.fileId = uploadResult.fileId;
            item.fileSizeBytes = uploadResult.fileSizeBytes;
            item.originalFileName = file.originalname;
        }
        if (!item.source && !item.fileId) {
            throw new common_1.BadRequestException('Lesson must have either a YouTube link or a PDF file');
        }
        await item.save();
        return item;
    }
    async deleteCurriculumLesson(curriculumId, lessonId) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const lesson = await curriculum_detail_model_1.CurriculumLesson.findOne({ where: { id: lessonId, curriculumId } });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (lesson.fileId) {
            await this.gcsService.deleteFile(lesson.fileId);
        }
        const deleted = await curriculum_detail_model_1.CurriculumLesson.destroy({ where: { id: lessonId, curriculumId } });
        return { message: 'Lesson deleted successfully' };
    }
    async getCurriculumExaminations(curriculumId, userId, role) {
        await this.assertTeacherCurriculumAccess(curriculumId, userId, role);
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        return curriculum_detail_model_1.CurriculumExamination.findAll({
            where: { curriculumId },
            order: [['createdAt', 'DESC']],
        });
    }
    async getCurriculumLessonPreviewUrl(curriculumId, lessonId) {
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const lesson = await curriculum_detail_model_1.CurriculumLesson.findOne({ where: { id: lessonId, curriculumId } });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (!lesson.fileId) {
            throw new common_1.BadRequestException('This lesson does not have a PDF file to preview');
        }
        return this.gcsService.getSignedUrl(lesson.fileId, 'lessons', 'pdf', 1);
    }
    async getExaminationQuestions(examId, userId, role) {
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam) {
            throw new common_1.NotFoundException('Examination not found');
        }
        await this.assertTeacherCurriculumAccess(exam.curriculumId, userId, role);
        const questions = await curriculum_detail_model_1.ExaminationQuestion.findAll({
            where: { examinationId: examId },
            order: [['createdAt', 'ASC']],
        });
        return Promise.all(questions.map(async (question) => {
            const raw = question.toJSON ? question.toJSON() : { ...question };
            const options = typeof raw.options === 'string' ? JSON.parse(raw.options || '[]') : raw.options || [];
            return {
                ...raw,
                questionImageUrl: raw.questionImageFileId
                    ? await this.gcsService.getSignedUrl(raw.questionImageFileId, 'exam-questions', raw.questionImageExtension || this.getExtensionFromStoredUrl(raw.questionImageUrl), 24)
                    : raw.questionImageUrl,
                options: await Promise.all(options.map(async (option) => ({
                    ...option,
                    imageUrl: option.imageFileId
                        ? await this.gcsService.getSignedUrl(option.imageFileId, 'exam-questions', option.imageExtension || 'png', 24)
                        : option.imageUrl,
                }))),
            };
        }));
    }
    async createExaminationQuestion(examId, question, questionImage, optionImages, userId, role) {
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam) {
            throw new common_1.NotFoundException('Examination not found');
        }
        if (exam.approvalStatus === 'approved')
            throw new common_1.ConflictException('Ujian yang disetujui terkunci dan tidak dapat diubah');
        await this.assertTeacherCurriculumAccess(exam.curriculumId, userId, role);
        const type = question.type === 'essay' ? 'essay' : 'multiple_choice';
        const questionText = String(question.questionText || '').trim();
        if (!questionText && !questionImage) {
            throw new common_1.BadRequestException('Question text or image is required');
        }
        let uploadedQuestionImageFileId;
        if (questionImage && questionImage.buffer) {
            const uploaded = await this.gcsService.uploadImage(questionImage.buffer, questionImage.originalname || 'question-image', questionImage.mimetype || 'image/png', 'exam-questions');
            uploadedQuestionImageFileId = uploaded.fileId;
        }
        let normalizedOptions = [];
        if (type === 'multiple_choice') {
            normalizedOptions = Array.isArray(question.options) ? question.options.map((option) => ({
                text: option?.text?.trim() || undefined,
                imageUrl: option?.imageUrl || undefined,
                imageFileId: option?.imageFileId || undefined,
                imageExtension: option?.imageExtension || undefined,
            })) : [];
            if (optionImages && optionImages.length > 0) {
                for (let index = 0; index < optionImages.length; index += 1) {
                    const optionImage = optionImages[index];
                    const optionIndex = question.optionImageIndexes?.[index] ?? index;
                    if (optionImage?.buffer) {
                        const uploaded = await this.gcsService.uploadImage(optionImage.buffer, optionImage.originalname || `option-${index + 1}`, optionImage.mimetype || 'image/png', 'exam-questions');
                        normalizedOptions[optionIndex] = {
                            ...normalizedOptions[optionIndex],
                            imageFileId: uploaded.fileId,
                            imageExtension: this.getImageExtension(optionImage.mimetype),
                            imageUrl: await this.gcsService.getSignedUrl(uploaded.fileId, 'exam-questions', this.getImageExtension(optionImage.mimetype), 24),
                        };
                    }
                }
            }
            const validOptionIndices = normalizedOptions.reduce((indices, option, index) => {
                if (option.text || option.imageFileId || option.imageUrl)
                    indices.push(index);
                return indices;
            }, []);
            if (validOptionIndices.length < 2) {
                throw new common_1.BadRequestException('Multiple choice questions require at least two options with text or image content');
            }
            if (question.correctOptionIndex === undefined || !validOptionIndices.includes(question.correctOptionIndex)) {
                throw new common_1.BadRequestException('Correct option index is required and must match one of the provided options');
            }
            normalizedOptions = validOptionIndices.map((index) => normalizedOptions[index]);
            question.correctOptionIndex = validOptionIndices.indexOf(question.correctOptionIndex);
        }
        const record = await curriculum_detail_model_1.ExaminationQuestion.create({
            examinationId: examId,
            type,
            questionText: questionText || undefined,
            questionImageFileId: uploadedQuestionImageFileId,
            questionImageExtension: questionImage ? this.getImageExtension(questionImage.mimetype) : undefined,
            questionImageUrl: uploadedQuestionImageFileId ? await this.gcsService.getSignedUrl(uploadedQuestionImageFileId, 'exam-questions', questionImage ? this.getImageExtension(questionImage.mimetype) : 'png', 24) : undefined,
            options: JSON.stringify(normalizedOptions),
            correctOptionIndex: type === 'multiple_choice' ? Number(question.correctOptionIndex ?? 0) : null,
            points: this.normalizeQuestionPoints(question.points),
            answer: question.answer?.trim() || undefined,
        });
        const raw = record.toJSON ? record.toJSON() : { ...record };
        return {
            ...raw,
            options: typeof raw.options === 'string' ? JSON.parse(raw.options || '[]') : raw.options || [],
        };
    }
    async updateExaminationQuestion(examId, questionId, question, questionImage, optionImages, userId, role) {
        const exam = await curriculum_detail_model_1.CurriculumExamination.findByPk(examId);
        if (!exam)
            throw new common_1.NotFoundException('Examination not found');
        if (exam.approvalStatus === 'approved')
            throw new common_1.ConflictException('Approved examinations are locked and cannot be changed');
        await this.assertTeacherCurriculumAccess(exam.curriculumId, userId, role);
        const record = await curriculum_detail_model_1.ExaminationQuestion.findOne({ where: { id: questionId, examinationId: examId } });
        if (!record)
            throw new common_1.NotFoundException('Examination question not found');
        const type = question.type === 'essay' ? 'essay' : 'multiple_choice';
        const questionText = String(question.questionText || '').trim();
        if (!questionText && !questionImage && !question.existingQuestionImageFileId && !record.questionImageFileId) {
            throw new common_1.BadRequestException('Question text or image is required');
        }
        let questionImageFileId = question.existingQuestionImageFileId || record.questionImageFileId;
        if (questionImage?.buffer) {
            const uploaded = await this.gcsService.uploadImage(questionImage.buffer, questionImage.originalname || 'question-image', questionImage.mimetype || 'image/png', 'exam-questions');
            questionImageFileId = uploaded.fileId;
        }
        let normalizedOptions = Array.isArray(question.options)
            ? question.options.map((option) => ({
                text: option?.text?.trim() || undefined,
                imageUrl: option?.imageUrl || undefined,
                imageFileId: option?.imageFileId || undefined,
                imageExtension: option?.imageExtension || undefined,
            }))
            : [];
        for (let index = 0; index < (optionImages || []).length; index += 1) {
            const optionImage = optionImages?.[index];
            const optionIndex = question.optionImageIndexes?.[index] ?? index;
            if (!optionImage?.buffer)
                continue;
            const uploaded = await this.gcsService.uploadImage(optionImage.buffer, optionImage.originalname || `option-${index + 1}`, optionImage.mimetype || 'image/png', 'exam-questions');
            const imageExtension = this.getImageExtension(optionImage.mimetype);
            normalizedOptions[optionIndex] = {
                ...normalizedOptions[optionIndex],
                imageFileId: uploaded.fileId,
                imageExtension,
                imageUrl: await this.gcsService.getSignedUrl(uploaded.fileId, 'exam-questions', imageExtension, 24),
            };
        }
        const validOptionIndices = normalizedOptions.reduce((indices, option, index) => {
            if (option.text || option.imageFileId || option.imageUrl)
                indices.push(index);
            return indices;
        }, []);
        if (type === 'multiple_choice' && validOptionIndices.length < 2) {
            throw new common_1.BadRequestException('Multiple choice questions require at least two options with text or image content');
        }
        if (type === 'multiple_choice' && (question.correctOptionIndex === undefined || !validOptionIndices.includes(question.correctOptionIndex))) {
            throw new common_1.BadRequestException('Correct option index is required and must match one of the provided options');
        }
        const compactedOptions = type === 'multiple_choice' ? validOptionIndices.map((index) => normalizedOptions[index]) : [];
        const correctOptionIndex = type === 'multiple_choice' ? validOptionIndices.indexOf(question.correctOptionIndex) : null;
        await record.update({
            type,
            questionText: questionText || undefined,
            questionImageFileId: questionImageFileId || undefined,
            questionImageExtension: questionImage?.mimetype
                ? this.getImageExtension(questionImage.mimetype)
                : record.questionImageExtension,
            questionImageUrl: questionImageFileId ? await this.gcsService.getSignedUrl(questionImageFileId, 'exam-questions', questionImage?.mimetype ? this.getImageExtension(questionImage.mimetype) : record.questionImageExtension || 'png', 24) : undefined,
            options: JSON.stringify(compactedOptions),
            correctOptionIndex,
            points: this.normalizeQuestionPoints(question.points),
            answer: question.answer?.trim() || undefined,
        });
        const raw = record.toJSON ? record.toJSON() : { ...record };
        return {
            ...raw,
            options: compactedOptions,
        };
    }
    async createCurriculumExamination(curriculumId, exam, userId, role) {
        await this.assertTeacherCurriculumAccess(curriculumId, userId, role);
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const title = String(exam.title || '').trim();
        const examType = String(exam.examType || 'Regular Examination').trim() || 'Regular Examination';
        if (!title) {
            throw new common_1.BadRequestException('Examination title is required');
        }
        this.validateExamSchedule(exam.examDate, exam.examStartTime, exam.examEndTime);
        return curriculum_detail_model_1.CurriculumExamination.create({
            curriculumId,
            title,
            examType,
            description: exam.description?.trim() || undefined,
            examDate: exam.examDate || undefined,
            examStartTime: exam.examStartTime || undefined,
            examEndTime: exam.examEndTime || undefined,
        });
    }
    async updateCurriculumExamination(curriculumId, examId, exam, userId, role) {
        await this.assertTeacherCurriculumAccess(curriculumId, userId, role);
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const item = await curriculum_detail_model_1.CurriculumExamination.findOne({ where: { id: examId, curriculumId } });
        if (!item) {
            throw new common_1.NotFoundException('Examination not found');
        }
        if (item.approvalStatus === 'approved' || this.isExamPast(item))
            throw new common_1.ConflictException('Ujian yang sudah terkunci atau sudah lewat tidak dapat diubah');
        if (exam.title !== undefined) {
            item.title = String(exam.title).trim();
        }
        if (exam.examType !== undefined) {
            item.examType = String(exam.examType).trim() || 'Regular Examination';
        }
        if (exam.description !== undefined) {
            item.description = exam.description?.trim() || undefined;
        }
        if (exam.examDate !== undefined) {
            item.examDate = exam.examDate || undefined;
        }
        if (exam.examStartTime !== undefined) {
            item.examStartTime = exam.examStartTime || undefined;
        }
        if (exam.examEndTime !== undefined) {
            item.examEndTime = exam.examEndTime || undefined;
        }
        this.validateExamSchedule(item.examDate, item.examStartTime, item.examEndTime);
        await item.save();
        return item;
    }
    async deleteCurriculumExamination(curriculumId, examId, userId, role) {
        await this.assertTeacherCurriculumAccess(curriculumId, userId, role);
        const curriculum = await curriculum_model_1.Curriculum.findByPk(curriculumId);
        if (!curriculum) {
            throw new common_1.NotFoundException('Curriculum not found');
        }
        const existing = await curriculum_detail_model_1.CurriculumExamination.findOne({ where: { id: examId, curriculumId } });
        if (existing && (existing.approvalStatus === 'approved' || this.isExamPast(existing)))
            throw new common_1.ConflictException('Ujian yang sudah terkunci atau sudah lewat tidak dapat dihapus');
        const deleted = await curriculum_detail_model_1.CurriculumExamination.destroy({ where: { id: examId, curriculumId } });
        if (!deleted) {
            throw new common_1.NotFoundException('Examination not found');
        }
        return { message: 'Examination deleted successfully' };
    }
    async deleteClassroom(id) {
        const classroom = await classroom_model_1.Classroom.findByPk(id);
        if (!classroom) {
            throw new common_1.NotFoundException('Classroom not found');
        }
        await classroom_model_1.ClassroomStudent.destroy({ where: { classroomId: id } });
        await classroom.destroy();
        return { message: 'Classroom deleted successfully' };
    }
    async getClassrooms() {
        const classrooms = await classroom_model_1.Classroom.findAll({
            order: [['gradeLevel', 'ASC'], ['classCode', 'ASC']],
        });
        const classroomStudents = await classroom_model_1.ClassroomStudent.findAll();
        const studentMap = new Map();
        for (const row of classroomStudents) {
            const members = studentMap.get(row.classroomId) || [];
            members.push(row.studentId);
            studentMap.set(row.classroomId, members);
        }
        return classrooms.sort((left, right) => {
            const yearDifference = this.getAcademicStartYear(right.academicPeriod) - this.getAcademicStartYear(left.academicPeriod);
            if (yearDifference !== 0)
                return yearDifference;
            const gradeDifference = Number(left.gradeLevel) - Number(right.gradeLevel);
            if (gradeDifference !== 0)
                return gradeDifference;
            return left.classCode.localeCompare(right.classCode);
        }).map((classroom) => {
            const studentIds = studentMap.get(classroom.id) || [];
            return {
                ...classroom.toJSON(),
                studentCount: studentIds.length,
                studentIds,
                studentNames: [],
                studentDetails: [],
            };
        });
    }
    async getTeacherClassroom(teacherId) {
        if (!teacherId)
            throw new common_1.UnauthorizedException('Authenticated teacher is required');
        const teacher = await account_model_1.Account.findByPk(teacherId);
        if (!teacher || !teacher.badge?.split(',').some((badge) => badge.trim().toLowerCase() === 'wali kelas')) {
            throw new common_1.UnauthorizedException('Teacher is not assigned as a homeroom teacher');
        }
        const classroom = await classroom_model_1.Classroom.findOne({ where: { homeroomTeacherId: teacherId } });
        if (!classroom)
            return null;
        const memberships = await classroom_model_1.ClassroomStudent.findAll({ where: { classroomId: classroom.id } });
        const students = await account_model_1.Account.findAll({ where: { id: { [sequelize_1.Op.in]: memberships.map((item) => item.studentId) } } });
        const studentMap = new Map(students.map((student) => [student.id, student]));
        return {
            ...classroom.toJSON(),
            studentCount: memberships.length,
            students: memberships.map((membership) => {
                const student = studentMap.get(membership.studentId);
                return {
                    id: membership.studentId,
                    fullName: student?.fullName || student?.name || membership.studentId,
                    email: student?.email,
                    status: student?.status,
                };
            }),
        };
    }
    async getTeacherAssignments(teacherId) {
        if (!teacherId)
            throw new common_1.UnauthorizedException('Authenticated teacher is required');
        const curriculums = await curriculum_model_1.Curriculum.findAll({ order: [['subjectName', 'ASC']] });
        const assignedCurriculums = curriculums.filter((curriculum) => this.normalizeTeacherIdsList(curriculum.teacherIds).includes(teacherId));
        const curriculumIds = assignedCurriculums.map((curriculum) => curriculum.id);
        const examinations = curriculumIds.length
            ? await curriculum_detail_model_1.CurriculumExamination.findAll({ where: { curriculumId: { [sequelize_1.Op.in]: curriculumIds } }, order: [['examDate', 'ASC'], ['createdAt', 'ASC']] })
            : [];
        const curriculumMap = new Map(assignedCurriculums.map((curriculum) => [curriculum.id, curriculum]));
        return {
            examinations: examinations.map((exam) => ({
                ...exam.toJSON(),
                subjectName: curriculumMap.get(exam.curriculumId)?.subjectName,
                gradeLevel: curriculumMap.get(exam.curriculumId)?.gradeLevel,
            })),
            results: [],
        };
    }
    mergeBadgeValues(existingBadge, newBadge) {
        const badges = new Set();
        const rawBadges = (existingBadge || '').split(',').map((value) => value.trim()).filter(Boolean);
        rawBadges.forEach((badge) => badges.add(badge));
        if (newBadge) {
            const normalized = newBadge.trim();
            if (normalized) {
                badges.add(normalized);
            }
        }
        return badges.size > 0 ? Array.from(badges).join(', ') : undefined;
    }
    removeBadgeValue(existingBadge, badgeToRemove) {
        const normalizedRemove = (badgeToRemove || '').trim();
        if (!normalizedRemove) {
            return existingBadge;
        }
        const badges = (existingBadge || '')
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value && value.toLowerCase() !== normalizedRemove.toLowerCase());
        return badges.length > 0 ? badges.join(', ') : undefined;
    }
    getAcademicStartYear(academicPeriod) {
        return Number(academicPeriod.match(/\d{4}/)?.[0] || 0);
    }
    async createClassroom(body) {
        const gradeLevel = String(body.gradeLevel || '').trim();
        const academicPeriod = String(body.academicPeriod || '').trim();
        const classCode = String(body.classCode || '').trim().toUpperCase();
        if (!['7', '8', '9'].includes(gradeLevel)) {
            throw new common_1.BadRequestException('Grade level must be one of: 7, 8, or 9.');
        }
        if (!/^(Genap|Ganjil)\s+\d{4}\s*-\s*(Genap|Ganjil)\s+\d{4}$/.test(academicPeriod)) {
            throw new common_1.BadRequestException('Academic period must follow the format like "Genap 2026 - Ganjil 2027".');
        }
        if (!/^[A-Z]$/.test(classCode)) {
            throw new common_1.BadRequestException('Classroom code must be exactly one letter from A to Z.');
        }
        const duplicateClassroom = await classroom_model_1.Classroom.findOne({ where: { gradeLevel, academicPeriod, classCode } });
        if (duplicateClassroom) {
            throw new common_1.ConflictException('A classroom with the same grade, code, and academic period already exists');
        }
        const teacher = body.homeroomTeacherId ? await account_model_1.Account.findByPk(body.homeroomTeacherId) : null;
        if (body.homeroomTeacherId && (!teacher || teacher.role !== account_model_1.AccountRole.TEACHER)) {
            throw new common_1.BadRequestException('Homeroom teacher must be a Teacher account');
        }
        if (teacher) {
            const existingHomeroom = await classroom_model_1.Classroom.findOne({ where: { homeroomTeacherId: teacher.id, academicPeriod } });
            if (existingHomeroom) {
                throw new common_1.ConflictException('A teacher can only be assigned as homeroom teacher to one classroom in the same academic period');
            }
        }
        let classroom;
        try {
            classroom = await classroom_model_1.Classroom.create({
                gradeLevel,
                academicPeriod,
                classCode,
                homeroomTeacherId: teacher?.id ?? undefined,
                homeroomTeacherName: body.homeroomTeacherName || (teacher ? teacher.fullName || teacher.name || undefined : undefined),
            });
        }
        catch (error) {
            if (error?.name === 'SequelizeUniqueConstraintError') {
                throw new common_1.ConflictException('A classroom with the same grade, code, and academic period already exists');
            }
            throw error;
        }
        if (teacher) {
            const mergedBadge = this.mergeBadgeValues(teacher.badge, 'Wali Kelas');
            if (mergedBadge && mergedBadge !== teacher.badge) {
                await teacher.update({ badge: mergedBadge });
            }
        }
        return classroom;
    }
    async updateClassroom(id, updateDto) {
        const classroom = await classroom_model_1.Classroom.findByPk(id);
        if (!classroom) {
            throw new common_1.NotFoundException('Classroom not found');
        }
        const previousTeacherId = classroom.homeroomTeacherId;
        if (updateDto.gradeLevel !== undefined) {
            const gradeLevel = String(updateDto.gradeLevel).trim();
            if (!['7', '8', '9'].includes(gradeLevel)) {
                throw new common_1.BadRequestException('Grade level must be one of: 7, 8, or 9.');
            }
            classroom.gradeLevel = gradeLevel;
        }
        if (updateDto.academicPeriod !== undefined) {
            const academicPeriod = String(updateDto.academicPeriod).trim();
            if (!/^(Genap|Ganjil)\s+\d{4}\s*-\s*(Genap|Ganjil)\s+\d{4}$/.test(academicPeriod)) {
                throw new common_1.BadRequestException('Academic period must follow the format like "Genap 2026 - Ganjil 2027".');
            }
            classroom.academicPeriod = academicPeriod;
        }
        if (updateDto.classCode !== undefined) {
            const classCode = String(updateDto.classCode).trim().toUpperCase();
            if (!/^[A-Z]$/.test(classCode)) {
                throw new common_1.BadRequestException('Classroom code must be exactly one letter from A to Z.');
            }
            classroom.classCode = classCode;
        }
        const duplicateClassroom = await classroom_model_1.Classroom.findOne({
            where: {
                id: { [sequelize_1.Op.ne]: id },
                gradeLevel: classroom.gradeLevel,
                academicPeriod: classroom.academicPeriod,
                classCode: classroom.classCode,
            },
        });
        if (duplicateClassroom) {
            throw new common_1.ConflictException('A classroom with the same grade, code, and academic period already exists');
        }
        let nextTeacher = null;
        if (updateDto.homeroomTeacherId !== undefined) {
            nextTeacher = updateDto.homeroomTeacherId ? await account_model_1.Account.findByPk(updateDto.homeroomTeacherId) : null;
            if (updateDto.homeroomTeacherId && (!nextTeacher || nextTeacher.role !== account_model_1.AccountRole.TEACHER)) {
                throw new common_1.BadRequestException('Homeroom teacher must be a Teacher account');
            }
            if (nextTeacher) {
                const existingHomeroom = await classroom_model_1.Classroom.findOne({ where: { homeroomTeacherId: nextTeacher.id, academicPeriod: classroom.academicPeriod, id: { [sequelize_1.Op.ne]: id } } });
                if (existingHomeroom) {
                    throw new common_1.ConflictException('A teacher can only be assigned as homeroom teacher to one classroom in the same academic period');
                }
            }
            classroom.homeroomTeacherId = nextTeacher?.id ?? undefined;
            classroom.homeroomTeacherName = updateDto.homeroomTeacherName || (nextTeacher ? nextTeacher.fullName || nextTeacher.name || undefined : undefined);
        }
        if (classroom.homeroomTeacherId) {
            const existingHomeroom = await classroom_model_1.Classroom.findOne({ where: { homeroomTeacherId: classroom.homeroomTeacherId, academicPeriod: classroom.academicPeriod, id: { [sequelize_1.Op.ne]: id } } });
            if (existingHomeroom) {
                throw new common_1.ConflictException('A teacher can only be assigned as homeroom teacher to one classroom in the same academic period');
            }
        }
        if (previousTeacherId && previousTeacherId !== (nextTeacher?.id || classroom.homeroomTeacherId)) {
            const previousTeacher = await account_model_1.Account.findByPk(previousTeacherId);
            if (previousTeacher) {
                const updatedBadge = this.removeBadgeValue(previousTeacher.badge, 'Wali Kelas');
                if (updatedBadge !== previousTeacher.badge) {
                    await previousTeacher.update({ badge: updatedBadge });
                }
            }
        }
        if (nextTeacher) {
            const mergedBadge = this.mergeBadgeValues(nextTeacher.badge, 'Wali Kelas');
            if (mergedBadge && mergedBadge !== nextTeacher.badge) {
                await nextTeacher.update({ badge: mergedBadge });
            }
        }
        await classroom.save();
        return classroom;
    }
    async addStudentsToClassroom(classroomId, studentIds) {
        const classroom = await classroom_model_1.Classroom.findByPk(classroomId);
        if (!classroom) {
            throw new common_1.NotFoundException('Classroom not found');
        }
        const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))];
        if (uniqueStudentIds.length === 0) {
            throw new common_1.BadRequestException('At least one student ID is required');
        }
        const records = [];
        for (const studentId of uniqueStudentIds) {
            const student = await account_model_1.Account.findByPk(studentId);
            if (!student) {
                throw new common_1.NotFoundException(`Student not found: ${studentId}`);
            }
            const existingMemberships = await classroom_model_1.ClassroomStudent.findAll({ where: { studentId } });
            const existingClassroomIds = existingMemberships
                .map((membership) => membership.classroomId)
                .filter((existingClassroomId) => existingClassroomId !== classroomId);
            if (existingClassroomIds.length > 0) {
                const existingClassrooms = await classroom_model_1.Classroom.findAll({ where: { id: { [sequelize_1.Op.in]: existingClassroomIds } } });
                if (existingClassrooms.some((existingClassroom) => existingClassroom.academicPeriod === classroom.academicPeriod)) {
                    throw new common_1.ConflictException(`Student ${studentId} is already assigned to a classroom in the same academic period`);
                }
                const newGrade = Number(classroom.gradeLevel);
                const newYear = this.getAcademicStartYear(classroom.academicPeriod);
                if (existingClassrooms.some((existingClassroom) => {
                    const existingGrade = Number(existingClassroom.gradeLevel);
                    const existingYear = this.getAcademicStartYear(existingClassroom.academicPeriod);
                    return newGrade > existingGrade && newYear < existingYear;
                })) {
                    throw new common_1.ConflictException(`Student ${studentId} cannot be assigned to a higher grade in an earlier academic period`);
                }
            }
            const existing = await classroom_model_1.ClassroomStudent.findOne({ where: { classroomId, studentId } });
            if (!existing) {
                records.push({ classroomId, studentId });
            }
        }
        if (records.length > 0) {
            await classroom_model_1.ClassroomStudent.bulkCreate(records);
        }
        return { message: 'Students added to classroom successfully', classroomId, studentCount: records.length };
    }
    async removeStudentFromClassroom(classroomId, studentId) {
        const deleted = await classroom_model_1.ClassroomStudent.destroy({ where: { classroomId, studentId } });
        if (!deleted) {
            throw new common_1.NotFoundException('Student is not part of this classroom');
        }
        return { message: 'Student removed from classroom successfully' };
    }
    async updateUserForAdmin(userId, updateDto) {
        const account = await account_model_1.Account.findByPk(userId);
        if (!account) {
            throw new common_1.NotFoundException('User not found');
        }
        const allowedFields = [
            'name',
            'fullName',
            'email',
            'phoneNumber',
            'birthday',
            'gender',
            'parentName',
            'badge',
            'role',
            'status',
        ];
        const updates = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(updateDto, field) && updateDto[field] !== undefined) {
                updates[field] = updateDto[field];
            }
        }
        if (Object.keys(updates).length === 0) {
            return {
                message: 'No valid user fields to update',
                user: this.getSafeUserResponse(account),
            };
        }
        if (updates.email) {
            const duplicateUser = await account_model_1.Account.findOne({ where: { email: updates.email } });
            if (duplicateUser && duplicateUser.id !== userId) {
                throw new common_1.ConflictException('Another user already uses this email address.');
            }
        }
        if (updates.role && !Object.values(account_model_1.AccountRole).includes(updates.role)) {
            throw new common_1.BadRequestException('Invalid role value.');
        }
        if (updates.role && updates.role !== account.role) {
            throw new common_1.ConflictException('Peran pengguna sudah ditetapkan saat persetujuan dan tidak dapat diubah');
        }
        if (updates.badge !== undefined && updates.badge !== account.badge) {
            throw new common_1.ConflictException('Lencana pengguna hanya dapat diperbarui melalui penetapan wali kelas');
        }
        if (updates.status && !Object.values(account_model_1.AccountStatus).includes(updates.status)) {
            throw new common_1.BadRequestException('Invalid account status value.');
        }
        await account.update(updates);
        return {
            message: 'User updated successfully.',
            user: this.getSafeUserResponse(account),
        };
    }
    async updateUserRoleForAdmin(userId, role, badge) {
        const allowedRoles = Object.values(account_model_1.AccountRole);
        if (!allowedRoles.includes(role)) {
            throw new common_1.BadRequestException('Invalid role value.');
        }
        const account = await account_model_1.Account.findByPk(userId);
        if (!account) {
            throw new common_1.NotFoundException('User not found');
        }
        if (account.role !== role) {
            throw new common_1.ConflictException('Peran pengguna sudah ditetapkan saat persetujuan dan tidak dapat diubah');
        }
        if (badge !== undefined && badge !== account.badge) {
            throw new common_1.ConflictException('Lencana pengguna hanya dapat diperbarui melalui penetapan wali kelas');
        }
        await account.update({
            role: role,
            badge: badge ?? account.badge,
        });
        return {
            message: 'User role updated successfully.',
            user: this.getSafeUserResponse(account),
        };
    }
    async deleteUserForAdmin(userId) {
        const account = await account_model_1.Account.findByPk(userId);
        if (!account) {
            throw new common_1.NotFoundException('User not found');
        }
        await account.destroy();
        return {
            message: 'User deleted successfully.',
        };
    }
    async getAvailableBadges() {
        return Object.values(badge_utils_1.BADGE_DEFINITIONS).map((def) => ({
            name: def.name,
            role: def.role,
            displayName: def.displayName,
        }));
    }
    async updateUserBadges(userId, badges, mfaCode) {
        const account = await account_model_1.Account.findByPk(userId);
        if (!account) {
            throw new common_1.NotFoundException('User not found');
        }
        throw new common_1.ConflictException('Lencana dan peran pengguna tidak dapat diubah setelah persetujuan');
    }
    getSafeUserResponse(account) {
        const plain = account.toJSON ? account.toJSON() : { ...account };
        const { password, passwordResetToken, passwordResetExpires, ...safeUser } = plain;
        return safeUser;
    }
    async registerUser(registerDto) {
        const email = registerDto.email.trim().toLowerCase();
        const name = registerDto.name;
        const existingAccount = await account_model_1.Account.findOne({ where: { email } });
        if (existingAccount) {
            throw new common_1.ConflictException('Email already registered.');
        }
        const phoneNumber = registerDto.phoneNumber?.trim();
        if (phoneNumber) {
            const existingPhone = await account_model_1.Account.findOne({ where: { phoneNumber } });
            if (existingPhone) {
                throw new common_1.ConflictException('This phone number is already registered.');
            }
        }
        const existingRequest = await this.getPendingRegistrationRequestByEmail(email);
        if (existingRequest) {
            const requestStatus = existingRequest.status;
            const hasSuccessfulEmailConfirmation = Boolean(existingRequest.emailVerified);
            if (requestStatus === registration_request_model_1.RegistrationStatus.APPROVED) {
                throw new common_1.ConflictException('This email has already been approved for registration.');
            }
            if (hasSuccessfulEmailConfirmation) {
                throw new common_1.ConflictException('This email has already been verified. Please wait for admin approval or contact support.');
            }
            const otp = password_util_1.PasswordUtil.generateOTP();
            const otpHash = await password_util_1.PasswordUtil.hashPassword(otp);
            const transaction = typeof this.sequelize?.transaction === 'function'
                ? await this.sequelize.transaction()
                : undefined;
            try {
                await this.pruneDuplicatePendingRegistrationRequests(email, existingRequest.id, transaction);
                await existingRequest.update({
                    verificationCode: otpHash,
                    otpResendCount: Number(existingRequest.otpResendCount ?? 0) + 1,
                    lastOtpSentAt: new Date(),
                    status: registration_request_model_1.RegistrationStatus.PENDING,
                    emailVerified: false,
                }, transaction ? { transaction } : undefined);
                const otpSent = await this.emailService.sendOTPEmail(email, otp, name);
                if (!otpSent) {
                    throw new common_1.BadRequestException('Unable to send verification email at the moment. Please try again later.');
                }
                const response = {
                    message: 'Registration request submitted. Please verify your email.',
                    registrationId: existingRequest.id,
                    registrationRequestId: existingRequest.id,
                    email: existingRequest.email,
                };
                if (process.env.NODE_ENV !== 'production') {
                    response.verificationCode = otp;
                    response.message =
                        'Registration request submitted. Use the verification code below in development mode.';
                }
                await transaction?.commit();
                return response;
            }
            catch (error) {
                await transaction?.rollback();
                throw error;
            }
        }
        const otp = password_util_1.PasswordUtil.generateOTP();
        const otpHash = await password_util_1.PasswordUtil.hashPassword(otp);
        try {
            const transaction = typeof this.sequelize?.transaction === 'function'
                ? await this.sequelize.transaction()
                : undefined;
            try {
                const registrationRequest = await registration_request_model_1.RegistrationRequest.create({
                    ...registerDto,
                    email,
                    verificationCode: otpHash,
                    status: registration_request_model_1.RegistrationStatus.PENDING,
                    otpResendCount: 0,
                    lastOtpSentAt: new Date(),
                }, transaction ? { transaction } : undefined);
                const otpSent = await this.emailService.sendOTPEmail(email, otp, name);
                if (!otpSent) {
                    throw new common_1.BadRequestException('Unable to send verification email at the moment. Please try again later.');
                }
                const response = {
                    message: 'Registration request submitted. Please verify your email.',
                    registrationId: registrationRequest.id,
                    registrationRequestId: registrationRequest.id,
                    email: registrationRequest.email,
                };
                if (process.env.NODE_ENV !== 'production') {
                    response.verificationCode = otp;
                    response.message =
                        'Registration request submitted. Use the verification code below in development mode.';
                }
                await transaction?.commit();
                return response;
            }
            catch (error) {
                await transaction?.rollback();
                if (error?.name === 'SequelizeUniqueConstraintError') {
                    throw new common_1.ConflictException('This email or phone number is already registered.');
                }
                throw error;
            }
        }
        catch (error) {
            if (error?.name === 'SequelizeUniqueConstraintError') {
                throw new common_1.ConflictException('This email or phone number is already registered.');
            }
            throw error;
        }
    }
    async resendVerificationEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingAccount = await account_model_1.Account.findOne({ where: { email: normalizedEmail } });
        if (existingAccount) {
            throw new common_1.ConflictException('Email already registered.');
        }
        const registrationRequest = await this.getPendingRegistrationRequestByEmail(normalizedEmail);
        console.log('Registration request:', registrationRequest);
        if (!registrationRequest) {
            throw new common_1.NotFoundException('No pending registration request was found for this email.');
        }
        if (registrationRequest.emailVerified) {
            throw new common_1.BadRequestException('This email has already been verified.');
        }
        const now = Date.now();
        const lastOtpSentAt = registrationRequest.lastOtpSentAt
            ? new Date(registrationRequest.lastOtpSentAt).getTime()
            : new Date(registrationRequest.createdAt).getTime();
        const attemptCount = Number(registrationRequest.otpResendCount ?? 0);
        const delayMs = this.getResendDelayMs(attemptCount);
        if (now - lastOtpSentAt < delayMs) {
            const remainingMs = delayMs - (now - lastOtpSentAt);
            throw new common_1.BadRequestException({
                statusCode: 429,
                message: `Please wait ${(Math.ceil(remainingMs / 1000) || 1)} seconds before requesting a new OTP.`,
            });
        }
        const otp = password_util_1.PasswordUtil.generateOTP();
        const otpHash = await password_util_1.PasswordUtil.hashPassword(otp);
        const transaction = typeof this.sequelize?.transaction === 'function'
            ? await this.sequelize.transaction()
            : undefined;
        try {
            const otpSent = await this.emailService.sendOTPEmail(normalizedEmail, otp, registrationRequest.name);
            if (!otpSent) {
                throw new common_1.BadRequestException('Unable to send a new verification email right now. Please try again later.');
            }
            await registrationRequest.update({
                verificationCode: otpHash,
                otpResendCount: attemptCount + 1,
                lastOtpSentAt: new Date(),
            }, transaction ? { transaction } : undefined);
            await transaction?.commit();
        }
        catch (error) {
            await transaction?.rollback();
            throw error;
        }
        return {
            message: 'A new verification code has been sent to your email.',
            email: normalizedEmail,
            cooldownSeconds: Math.ceil(this.getResendDelayMs(attemptCount + 1) / 1000),
        };
    }
    async verifyEmailOTP(email, otp, registrationRequestId) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();
        const existingAccount = await account_model_1.Account.findOne({ where: { email: normalizedEmail } });
        if (existingAccount) {
            throw new common_1.ConflictException('Email already registered.');
        }
        let registrationRequest = registrationRequestId
            ? await registration_request_model_1.RegistrationRequest.findOne({
                where: {
                    id: registrationRequestId,
                    email: normalizedEmail,
                    status: registration_request_model_1.RegistrationStatus.PENDING,
                },
            })
            : null;
        if (!registrationRequest) {
            const pendingRequests = await registration_request_model_1.RegistrationRequest.findAll({
                where: {
                    email: normalizedEmail,
                    status: registration_request_model_1.RegistrationStatus.PENDING,
                },
                order: [['createdAt', 'DESC']],
            });
            if (!pendingRequests.length) {
                throw new common_1.NotFoundException('No pending registration request exists for this email. Please register again.');
            }
            const staleIds = pendingRequests
                .filter((request) => {
                const verificationCode = this.getModelValue(request, 'verificationCode');
                return !verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '';
            })
                .map((request) => request.id);
            if (staleIds.length > 0 && registration_request_model_1.RegistrationRequest.sequelize) {
                await registration_request_model_1.RegistrationRequest.destroy({
                    where: { id: { [sequelize_1.Op.in]: staleIds } },
                });
            }
            registrationRequest =
                pendingRequests.find((request) => {
                    const verificationCode = this.getModelValue(request, 'verificationCode');
                    return typeof verificationCode === 'string' && verificationCode.trim().length > 0;
                }) ?? null;
        }
        if (!registrationRequest) {
            throw new common_1.BadRequestException('The stored verification code is missing. Please request a new OTP using the resend option.');
        }
        if (registrationRequest.emailVerified) {
            throw new common_1.BadRequestException('This email has already been verified.');
        }
        const verificationCode = this.getModelValue(registrationRequest, 'verificationCode');
        if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '') {
            throw new common_1.BadRequestException('The stored verification code is missing. Please request a new OTP using the resend option.');
        }
        const createdTime = new Date(registrationRequest.createdAt).getTime();
        const currentTime = new Date().getTime();
        const hoursDifference = (currentTime - createdTime) / (1000 * 60 * 60);
        if (hoursDifference > 24) {
            await registrationRequest.destroy();
            throw new common_1.BadRequestException('Registration request has expired. Please register again.');
        }
        const isOTPValid = await password_util_1.PasswordUtil.comparePassword(normalizedOtp, verificationCode);
        if (!isOTPValid) {
            throw new common_1.UnauthorizedException('Invalid or expired verification code.');
        }
        await registrationRequest.update({ emailVerified: true });
        await registration_request_model_1.RegistrationRequest.destroy({
            where: {
                email: normalizedEmail,
                id: {
                    [sequelize_1.Op.ne]: registrationRequest.id,
                },
                status: registration_request_model_1.RegistrationStatus.PENDING,
            },
        });
        return {
            message: 'Email verified successfully. Awaiting admin approval.',
            registrationId: registrationRequest.id,
            registrationRequestId: registrationRequest.id,
            status: registration_request_model_1.RegistrationStatus.PENDING,
        };
    }
    getRoleFromBadge(badge, fallbackRole) {
        if (!badge || !badge.trim()) {
            return fallbackRole || account_model_1.AccountRole.GUEST;
        }
        try {
            const role = badge_utils_1.BadgeUtils.getRoleFromBadges(badge);
            return role || fallbackRole || account_model_1.AccountRole.GUEST;
        }
        catch {
            return fallbackRole || account_model_1.AccountRole.GUEST;
        }
    }
    async approveRegistration(approveDto, adminId) {
        const { email, assignedRole, assignedBadge, mfaCode } = approveDto;
        const normalizedAssignedRole = typeof assignedRole === 'string' ? assignedRole.trim() || undefined : assignedRole;
        const resolvedRole = this.getRoleFromBadge(assignedBadge, normalizedAssignedRole ?? account_model_1.AccountRole.GUEST);
        const registrationRequest = await registration_request_model_1.RegistrationRequest.findOne({
            where: { email },
        });
        if (!registrationRequest) {
            throw new common_1.NotFoundException('Registration request not found');
        }
        if (!registrationRequest.emailVerified) {
            throw new common_1.BadRequestException('Email must be verified first');
        }
        const hasTuBadge = (assignedBadge || '').split(',').map((badge) => badge.trim()).includes('TU');
        if (hasTuBadge) {
            const admin = await account_model_1.Account.findByPk(adminId);
            if (!admin) {
                throw new common_1.NotFoundException('Approving administrator not found');
            }
            if (!mfaCode) {
                const otp = password_util_1.PasswordUtil.generateOTP(6);
                const otpHash = await password_util_1.PasswordUtil.hashPassword(otp);
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
                const otpSent = await this.emailService.sendAdminApprovalOTPEmail(admin.email, otp, admin.fullName || admin.name);
                if (!otpSent) {
                    throw new common_1.BadRequestException('Unable to send the TU approval OTP. Please try again later.');
                }
                await registrationRequest.update({ approvalOtpHash: otpHash, approvalOtpExpiresAt: otpExpiresAt });
                return {
                    message: 'Approval OTP sent to the administrator email.',
                    requiresMFA: true,
                    mfaExpiration: otpExpiresAt,
                };
            }
            if (!registrationRequest.approvalOtpHash || !registrationRequest.approvalOtpExpiresAt) {
                throw new common_1.BadRequestException('Request an approval OTP before continuing.');
            }
            if (new Date(registrationRequest.approvalOtpExpiresAt) < new Date()) {
                throw new common_1.BadRequestException('Approval OTP has expired. Request a new OTP.');
            }
            if (!(await password_util_1.PasswordUtil.comparePassword(mfaCode.trim(), registrationRequest.approvalOtpHash))) {
                throw new common_1.UnauthorizedException('Invalid approval OTP.');
            }
        }
        const temporaryPassword = password_util_1.PasswordUtil.generateTemporaryPassword();
        const hashedPassword = await password_util_1.PasswordUtil.hashPassword(temporaryPassword);
        const transaction = typeof this.sequelize?.transaction === 'function'
            ? await this.sequelize.transaction()
            : undefined;
        let account;
        let temporaryPasswordSent;
        try {
            const accountData = {
                name: registrationRequest.name,
                fullName: registrationRequest.fullName,
                email: registrationRequest.email,
                phoneNumber: registrationRequest.phoneNumber,
                birthday: registrationRequest.birthday,
                gender: registrationRequest.gender,
                parentName: registrationRequest.parentName,
                password: hashedPassword,
                role: resolvedRole,
                badge: assignedBadge,
                status: account_model_1.AccountStatus.PENDING,
            };
            account = transaction
                ? await account_model_1.Account.create(accountData, { transaction })
                : await account_model_1.Account.create(accountData);
            await registrationRequest.update({
                status: registration_request_model_1.RegistrationStatus.APPROVED,
                assignedRole: resolvedRole,
                assignedBadge,
                approvedBy: adminId,
                approvedAt: new Date(),
                approvalOtpHash: null,
                approvalOtpExpiresAt: null,
            }, transaction ? { transaction } : undefined);
            temporaryPasswordSent = await this.emailService.sendTemporaryPasswordEmail(email, temporaryPassword, registrationRequest.fullName);
            if (!temporaryPasswordSent) {
                throw new common_1.BadRequestException('Registration was not completed because the temporary password email could not be sent.');
            }
            await registrationRequest.destroy(transaction ? { transaction } : undefined);
            await transaction?.commit();
        }
        catch (error) {
            await transaction?.rollback();
            if (error?.name === 'SequelizeUniqueConstraintError') {
                throw new common_1.ConflictException('This email or phone number is already registered.');
            }
            throw error;
        }
        return {
            message: temporaryPasswordSent
                ? 'Registration approved. Temporary password sent to email.'
                : 'Registration approved. Temporary password generated successfully.',
            accountId: account.id,
            email: account.email,
            role: account.role,
        };
    }
    async rejectRegistration(rejectDto) {
        const { email, rejectionReason } = rejectDto;
        const registrationRequest = await registration_request_model_1.RegistrationRequest.findOne({
            where: { email },
        });
        if (!registrationRequest) {
            throw new common_1.NotFoundException('Registration request not found');
        }
        const rejectionEmailSent = await this.emailService.sendRegistrationRejectionEmail(email, registrationRequest.fullName, rejectionReason);
        if (!rejectionEmailSent) {
            throw new common_1.BadRequestException('Registration was rejected, but the notification email could not be sent.');
        }
        const transaction = typeof this.sequelize?.transaction === 'function'
            ? await this.sequelize.transaction()
            : undefined;
        try {
            await registrationRequest.update({
                status: registration_request_model_1.RegistrationStatus.REJECTED,
                rejectionReason,
            }, transaction ? { transaction } : undefined);
            await registrationRequest.destroy(transaction ? { transaction } : undefined);
            await transaction?.commit();
        }
        catch (error) {
            await transaction?.rollback();
            throw error;
        }
        return {
            message: 'Registration rejected. Notification sent to user.',
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const account = await account_model_1.Account.findOne({
            where: { email },
            attributes: [
                'id',
                'email',
                'password',
                'name',
                'fullName',
                'role',
                'status',
                'badge',
            ],
        });
        if (!account) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await password_util_1.PasswordUtil.comparePassword(password, account.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (account.status === account_model_1.AccountStatus.PENDING) {
            return {
                requirePasswordChange: true,
                message: 'Please change your temporary password to activate your account',
                accountId: account.id,
                email: account.email,
            };
        }
        if (account.status !== account_model_1.AccountStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        await account.update({ lastLoginAt: new Date() });
        const tokens = await this.generateTokens(account.id, account.email, account.role);
        return {
            message: 'Login successful',
            ...tokens,
            user: {
                id: account.id,
                email: account.email,
                name: account.fullName || account.name,
                fullName: account.fullName || account.name,
                role: account.role,
                badge: account.badge,
            },
        };
    }
    async changeTemporaryPassword(accountId, updatePasswordDto) {
        const account = await account_model_1.Account.findByPk(accountId);
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const isCurrentPasswordValid = await password_util_1.PasswordUtil.comparePassword(updatePasswordDto.currentPassword, account.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const validation = password_util_1.PasswordUtil.validatePasswordStrength(updatePasswordDto.newPassword);
        if (!validation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Password does not meet requirements',
                errors: validation.errors,
            });
        }
        if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
            throw new common_1.BadRequestException('New passwords do not match');
        }
        const hashedPassword = await password_util_1.PasswordUtil.hashPassword(updatePasswordDto.newPassword);
        await account.update({
            password: hashedPassword,
            status: account_model_1.AccountStatus.ACTIVE,
        });
        return {
            message: 'Password changed successfully. Account activated.',
        };
    }
    async updateCurrentUserProfile(accountId, updateProfileDto) {
        const account = await account_model_1.Account.findByPk(accountId);
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const updates = {};
        if (updateProfileDto.name !== undefined) {
            updates.name = updateProfileDto.name.trim();
        }
        if (updateProfileDto.fullName !== undefined) {
            updates.fullName = updateProfileDto.fullName.trim();
        }
        if (updateProfileDto.phoneNumber !== undefined) {
            const phoneNumber = updateProfileDto.phoneNumber.trim();
            const phoneRegex = /^(?:\+62|62|0)[0-9\s\-()]{8,15}$/;
            if (!phoneRegex.test(phoneNumber)) {
                throw new common_1.BadRequestException('Phone number format is invalid');
            }
            updates.phoneNumber = phoneNumber;
        }
        if (Object.keys(updates).length === 0) {
            return this.getSafeUserResponse(account);
        }
        await account.update(updates);
        Object.assign(account, updates);
        return this.getSafeUserResponse(account);
    }
    async requestAccountDeactivationOTP(accountId) {
        const account = await account_model_1.Account.findByPk(accountId);
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const otp = password_util_1.PasswordUtil.generateOTP(6);
        const otpHash = await password_util_1.PasswordUtil.hashPassword(otp);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await account.update({
            passwordResetToken: otpHash,
            passwordResetExpires: otpExpiresAt,
        });
        const sent = await this.emailService.sendAccountDeactivationOTPEmail(account.email, otp, account.fullName || account.name);
        if (!sent && process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException('Unable to send deactivation confirmation OTP. Please try again later.');
        }
        return {
            message: 'A deactivation confirmation OTP has been sent to your email.',
            email: account.email,
            otp: sent ? undefined : otp,
        };
    }
    async confirmAccountDeactivation(accountId, otp) {
        const account = await account_model_1.Account.findByPk(accountId);
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (!account.passwordResetToken || !account.passwordResetExpires) {
            throw new common_1.BadRequestException('No deactivation confirmation is active for this account.');
        }
        const expiresAt = new Date(account.passwordResetExpires);
        if (expiresAt < new Date()) {
            await account.update({
                passwordResetToken: null,
                passwordResetExpires: null,
            });
            throw new common_1.BadRequestException('Deactivation confirmation code has expired. Please request a new one.');
        }
        const isCodeValid = await password_util_1.PasswordUtil.comparePassword(otp.trim(), account.passwordResetToken);
        if (!isCodeValid) {
            throw new common_1.UnauthorizedException('Invalid deactivation confirmation code');
        }
        await account.update({
            status: account_model_1.AccountStatus.INACTIVE,
            passwordResetToken: null,
            passwordResetExpires: null,
            refreshToken: null,
            refreshTokenExpiresAt: null,
        });
        return {
            message: 'Account deactivated successfully. You will no longer be able to access the system.',
        };
    }
    async requestPasswordReset(email) {
        const account = await account_model_1.Account.findOne({ where: { email } });
        if (!account) {
            throw new common_1.NotFoundException('No account found with this email address');
        }
        const resetCode = password_util_1.PasswordUtil.generateOTP(6);
        const resetCodeHash = await password_util_1.PasswordUtil.hashPassword(resetCode);
        const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await account.update({
            passwordResetToken: resetCodeHash,
            passwordResetExpires: resetExpiry,
        });
        const sent = await this.emailService.sendPasswordResetOTPEmail(email, resetCode, account.fullName || account.name);
        if (!sent && process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException('Unable to send reset code. Please try again later.');
        }
        return {
            message: sent || process.env.NODE_ENV !== 'production'
                ? 'Password reset code sent to your email.'
                : 'Password reset code generated in development mode.',
            email,
            resetCode: sent ? undefined : resetCode,
        };
    }
    async resetPassword(resetPasswordDto) {
        const { email, resetCode, newPassword, confirmPassword } = resetPasswordDto;
        const account = await account_model_1.Account.findOne({ where: { email } });
        if (!account) {
            throw new common_1.NotFoundException('No account found with this email address');
        }
        if (!account.passwordResetToken || !account.passwordResetExpires) {
            throw new common_1.BadRequestException('No password reset request found for this account');
        }
        const expiresAt = new Date(account.passwordResetExpires);
        if (expiresAt < new Date()) {
            await account.update({
                passwordResetToken: null,
                passwordResetExpires: null,
            });
            throw new common_1.BadRequestException('Password reset code has expired. Please request a new one.');
        }
        const isCodeValid = await password_util_1.PasswordUtil.comparePassword(resetCode, account.passwordResetToken);
        if (!isCodeValid) {
            throw new common_1.UnauthorizedException('Invalid password reset code');
        }
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const validation = password_util_1.PasswordUtil.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Password does not meet requirements',
                errors: validation.errors,
            });
        }
        const hashedPassword = await password_util_1.PasswordUtil.hashPassword(newPassword);
        await account.update({
            password: hashedPassword,
            status: account_model_1.AccountStatus.ACTIVE,
            passwordResetToken: null,
            passwordResetExpires: null,
        });
        return {
            message: 'Password reset successful. You can now log in with your new password.',
        };
    }
    async generateTokens(userId, email, role) {
        const accessTokenId = (0, crypto_1.randomBytes)(16).toString('hex');
        const issuer = process.env.JWT_ISSUER || 'lentera-school';
        const audience = process.env.JWT_AUDIENCE || 'lentera-client';
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const accessToken = this.jwtService.sign({
            sub: userId,
            email,
            role,
            jti: accessTokenId,
            iss: issuer,
            aud: audience,
            iat: nowInSeconds,
            nbf: nowInSeconds,
        }, {
            expiresIn: '15m',
        });
        const refreshToken = (0, crypto_1.randomBytes)(64).toString('hex');
        const refreshTokenExpiresAt = new Date(Date.now() + 10 * 60 * 60 * 1000);
        const account = await account_model_1.Account.findByPk(userId);
        if (account) {
            await account.update({
                refreshToken,
                refreshTokenExpiresAt,
            });
        }
        return {
            accessToken,
            refreshToken,
            expiresIn: '15m',
            tokenType: 'Bearer',
        };
    }
    async refreshAccessToken(refreshToken) {
        if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim().length < 64) {
            throw new common_1.UnauthorizedException('Refresh token is missing or invalid');
        }
        const account = await account_model_1.Account.findOne({
            where: {
                refreshToken,
            },
        });
        if (!account || account.status !== account_model_1.AccountStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Refresh token is invalid or the account is not active');
        }
        if (!account.refreshTokenExpiresAt) {
            await account.update({ refreshToken: null, refreshTokenExpiresAt: null });
            throw new common_1.UnauthorizedException('Refresh token is missing expiration. Please log in again.');
        }
        if (new Date(account.refreshTokenExpiresAt).getTime() <= Date.now()) {
            await account.update({ refreshToken: null, refreshTokenExpiresAt: null });
            throw new common_1.UnauthorizedException('Refresh token expired. Please log in again.');
        }
        const tokens = await this.generateTokens(account.id, account.email, account.role);
        return {
            message: 'Token refreshed successfully',
            ...tokens,
        };
    }
    async clearRefreshSession(refreshToken) {
        if (!refreshToken)
            return;
        await account_model_1.Account.update({ refreshToken: null, refreshTokenExpiresAt: null }, { where: { refreshToken } });
    }
    async cleanupExpiredRegistrations() {
        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await registration_request_model_1.RegistrationRequest.destroy({
            where: {
                status: registration_request_model_1.RegistrationStatus.PENDING,
                createdAt: {
                    [sequelize_1.Op.lt]: expirationTime,
                },
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize,
        jwt_1.JwtService,
        email_service_1.EmailService,
        gcs_service_1.GcsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map