"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const auth_service_1 = require("../services/auth.service");
const jwt_guard_1 = require("../guards/jwt.guard");
const auth_validation_guard_1 = require("../guards/auth-validation.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const account_model_1 = require("../models/account.model");
const registration_request_dto_1 = require("../dto/registration-request.dto");
let AdminController = class AdminController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async getRegistrationRequestsForAdmin() {
        return this.authService.getRegistrationRequestsForAdmin();
    }
    async getAdminDashboardStats() {
        return this.authService.getAdminDashboardStats();
    }
    async getPrincipalReportStats() {
        return this.authService.getPrincipalReportStats();
    }
    async getTeacherAssignmentOptions() {
        return this.authService.getTeacherAssignmentOptions();
    }
    async getCurriculumClassrooms(curriculumId) {
        return this.authService.getCurriculumClassrooms(curriculumId);
    }
    async assignCurriculumToClassrooms(curriculumId, body) {
        return this.authService.assignCurriculumToClassrooms(curriculumId, body.classroomIds || []);
    }
    async getUsersForAdmin(role, search, searchEmail, searchName, page, limit) {
        return this.authService.getUsersForAdmin({
            role,
            search,
            searchEmail,
            searchName,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async getUserByIdForAdmin(id) {
        const users = (await this.authService.getUsersForAdmin());
        const user = users.find((item) => item.id === id);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return user;
    }
    async updateUserForAdmin(id, updateDto) {
        return this.authService.updateUserForAdmin(id, updateDto);
    }
    async updateUserRoleForAdmin(id, body) {
        if (!body.role) {
            throw new common_1.BadRequestException('Role is required');
        }
        return this.authService.updateUserRoleForAdmin(id, body.role, body.badge);
    }
    async deleteUserForAdmin(id) {
        return this.authService.deleteUserForAdmin(id);
    }
    async updateUserBadges(id, body) {
        return this.authService.updateUserBadges(id, body.badges, body.mfaCode);
    }
    async getAvailableBadges() {
        return this.authService.getAvailableBadges();
    }
    async approveRegistrationMethodHint() {
        throw new common_1.MethodNotAllowedException('Use POST /api/admin/approve-registration with the registration payload to approve a request.');
    }
    async approveRegistration(req, approveDto) {
        const adminId = req.user?.userId || req.user?.sub;
        if (!adminId) {
            throw new common_1.BadRequestException('Authenticated admin user is required');
        }
        return this.authService.approveRegistration(approveDto, adminId);
    }
    async rejectRegistration(rejectDto) {
        return this.authService.rejectRegistration(rejectDto);
    }
    async getCurriculums(req) {
        return this.authService.getCurriculums(req.user?.userId, req.user?.role);
    }
    async createCurriculum(body) {
        return this.authService.createCurriculum(body);
    }
    async updateCurriculum(id, body) {
        return this.authService.updateCurriculum(id, body);
    }
    async deleteCurriculum(id) {
        return this.authService.deleteCurriculum(id);
    }
    async getCurriculumLessons(curriculumId, req) {
        return this.authService.getCurriculumLessons(curriculumId, req.user?.userId, req.user?.role);
    }
    async createCurriculumLesson(curriculumId, body, file) {
        return this.authService.createCurriculumLesson(curriculumId, body, file);
    }
    async updateCurriculumLesson(curriculumId, lessonId, body, file) {
        return this.authService.updateCurriculumLesson(curriculumId, lessonId, body, file);
    }
    async deleteCurriculumLesson(curriculumId, lessonId) {
        return this.authService.deleteCurriculumLesson(curriculumId, lessonId);
    }
    async getCurriculumExaminations(curriculumId, req) {
        return this.authService.getCurriculumExaminations(curriculumId, req.user?.userId, req.user?.role);
    }
    async getCurriculumLessonPreviewUrl(curriculumId, lessonId) {
        return {
            previewUrl: await this.authService.getCurriculumLessonPreviewUrl(curriculumId, lessonId),
        };
    }
    async getExaminationQuestions(examId, req) {
        return this.authService.getExaminationQuestions(examId, req.user?.userId, req.user?.role);
    }
    async generateExaminationQuestions(body) {
        return this.authService.generateExaminationQuestions(body);
    }
    async createExaminationQuestion(examId, body, req, files) {
        const parsedOptions = body.options ? JSON.parse(body.options) : [];
        const optionImageIndexes = body.optionImageIndexes ? JSON.parse(body.optionImageIndexes) : [];
        return this.authService.createExaminationQuestion(examId, {
            type: body.type,
            questionText: body.questionText,
            options: parsedOptions,
            optionImageIndexes,
            correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
            points: body.points !== undefined ? Number(body.points) : 1,
            answer: body.answer,
        }, files?.questionImage?.[0], files?.optionImages || [], req.user?.userId, req.user?.role);
    }
    async updateExaminationQuestion(examId, questionId, body, req, files) {
        const parsedOptions = body.options ? JSON.parse(body.options) : [];
        const optionImageIndexes = body.optionImageIndexes ? JSON.parse(body.optionImageIndexes) : [];
        return this.authService.updateExaminationQuestion(examId, questionId, {
            type: body.type,
            questionText: body.questionText,
            options: parsedOptions,
            optionImageIndexes,
            existingQuestionImageFileId: body.existingQuestionImageFileId,
            correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
            points: body.points !== undefined ? Number(body.points) : 1,
            answer: body.answer,
        }, files?.questionImage?.[0], files?.optionImages || [], req.user?.userId, req.user?.role);
    }
    async createExaminationQuestionWithOptionImages(examId, body, optionImages) {
        const parsedOptions = body.options ? JSON.parse(body.options) : [];
        return this.authService.createExaminationQuestion(examId, {
            type: body.type,
            questionText: body.questionText,
            options: parsedOptions,
            correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
            points: body.points !== undefined ? Number(body.points) : 1,
            answer: body.answer,
        }, undefined, optionImages || []);
    }
    async createCurriculumExamination(curriculumId, body, req) {
        return this.authService.createCurriculumExamination(curriculumId, body, req.user?.userId, req.user?.role);
    }
    async updateCurriculumExamination(curriculumId, examId, body, req) {
        return this.authService.updateCurriculumExamination(curriculumId, examId, body, req.user?.userId, req.user?.role);
    }
    async deleteCurriculumExamination(curriculumId, examId, req) {
        return this.authService.deleteCurriculumExamination(curriculumId, examId, req.user?.userId, req.user?.role);
    }
    async approveExamination(examId, req) {
        return this.authService.approveExamination(examId, req.user?.userId);
    }
    async unlockExamination(examId) {
        return this.authService.unlockExamination(examId);
    }
    async getClassrooms() {
        return this.authService.getClassrooms();
    }
    async getTeacherClassroom(req) {
        return this.authService.getTeacherClassroom(req.user?.userId);
    }
    async getTeacherAssignments(req) {
        return this.authService.getTeacherAssignments(req.user?.userId);
    }
    async createClassroom(body) {
        return this.authService.createClassroom(body);
    }
    async updateClassroom(id, body) {
        return this.authService.updateClassroom(id, body);
    }
    async deleteClassroom(id) {
        return this.authService.deleteClassroom(id);
    }
    async addStudentsToClassroom(id, body) {
        return this.authService.addStudentsToClassroom(id, body.studentIds || []);
    }
    async removeStudentFromClassroom(id, studentId) {
        return this.authService.removeStudentFromClassroom(id, studentId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('registration-requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRegistrationRequestsForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('dashboard/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminDashboardStats", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Get)('principal/reports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPrincipalReportStats", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Get)('teacher-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherAssignmentOptions", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Get)('curriculums/:curriculumId/classrooms'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCurriculumClassrooms", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Put)('curriculums/:curriculumId/classrooms'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignCurriculumToClassrooms", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('searchEmail')),
    __param(3, (0, common_1.Query)('searchName')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsersForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserByIdForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Patch)('users/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRoleForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUserForAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Patch)('users/:id/badges'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserBadges", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('badges'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAvailableBadges", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('approve-registration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveRegistrationMethodHint", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Post)('approve-registration'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, registration_request_dto_1.ApproveRegistrationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveRegistration", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Post)('reject-registration'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [registration_request_dto_1.RejectRegistrationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectRegistration", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER, account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('curriculums'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCurriculums", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.Post)('curriculums'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCurriculum", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.Patch)('curriculums/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCurriculum", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.Delete)('curriculums/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCurriculum", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER, account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('curriculums/:curriculumId/lessons'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCurriculumLessons", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, common_1.Post)('curriculums/:curriculumId/lessons'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCurriculumLesson", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, common_1.Patch)('curriculums/:curriculumId/lessons/:lessonId'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCurriculumLesson", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.Delete)('curriculums/:curriculumId/lessons/:lessonId'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCurriculumLesson", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER, account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('curriculums/:curriculumId/examinations'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCurriculumExaminations", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER, account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('curriculums/:curriculumId/lessons/:lessonId/preview-url'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCurriculumLessonPreviewUrl", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.TEACHER),
    (0, common_1.Get)('examinations/:examId/questions'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getExaminationQuestions", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.Post)('examinations/generate-questions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "generateExaminationQuestions", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'questionImage', maxCount: 1 },
        { name: 'optionImages', maxCount: 4 },
    ])),
    (0, common_1.Post)('examinations/:examId/questions'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createExaminationQuestion", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'questionImage', maxCount: 1 },
        { name: 'optionImages', maxCount: 4 },
    ])),
    (0, common_1.Patch)('examinations/:examId/questions/:questionId'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateExaminationQuestion", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('optionImages')),
    (0, common_1.Post)('examinations/:examId/questions/with-options-images'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createExaminationQuestionWithOptionImages", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.Post)('curriculums/:curriculumId/examinations'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCurriculumExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.Patch)('curriculums/:curriculumId/examinations/:examId'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Param)('examId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCurriculumExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.TEACHER),
    (0, common_1.Delete)('curriculums/:curriculumId/examinations/:examId'),
    __param(0, (0, common_1.Param)('curriculumId')),
    __param(1, (0, common_1.Param)('examId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCurriculumExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Post)('examinations/:examId/approve'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Post)('examinations/:examId/unlock'),
    __param(0, (0, common_1.Param)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unlockExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Get)('classrooms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClassrooms", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.TEACHER),
    (0, common_1.Get)('teacher/classroom'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherClassroom", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.TEACHER),
    (0, common_1.Get)('teacher/assignments'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherAssignments", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Post)('classrooms'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createClassroom", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Patch)('classrooms/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClassroom", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Delete)('classrooms/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClassroom", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Post)('classrooms/:id/students'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addStudentsToClassroom", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.SYSADMIN, account_model_1.AccountRole.PRINCIPAL),
    (0, common_1.Delete)('classrooms/:id/students/:studentId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeStudentFromClassroom", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, auth_validation_guard_1.AuthValidationGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/admin'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map