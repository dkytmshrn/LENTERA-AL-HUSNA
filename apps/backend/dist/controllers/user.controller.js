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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../guards/jwt.guard");
const auth_validation_guard_1 = require("../guards/auth-validation.guard");
const roles_guard_1 = require("../guards/roles.guard");
const account_model_1 = require("../models/account.model");
const roles_decorator_1 = require("../decorators/roles.decorator");
const auth_service_1 = require("../services/auth.service");
let UserController = class UserController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async getCurrentUser(req) {
        const userId = req.user?.userId || req.user?.sub;
        const users = (await this.authService.getUsersForAdmin());
        const user = users.find((item) => item.id === userId);
        return user || { id: userId };
    }
    async getStudentDashboard(req) {
        return this.authService.getStudentDashboard(req.user?.userId);
    }
    async generateLessonPractice(lessonId, req) {
        return this.authService.generateLessonPractice(lessonId, req.user?.userId);
    }
    async gradeLessonPractice(body) {
        return this.authService.gradeLessonPractice(body.questions || [], body.answers || {});
    }
    async getStudentReportCard(req, grade) {
        return this.authService.getStudentReportCard(req.user?.userId, grade);
    }
    async downloadStudentReportCard(req, res, grade) {
        const pdf = await this.authService.generateStudentReportCardPdf(req.user?.userId, grade);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rapor-mts-al-husna-lentera.pdf"', 'Content-Length': pdf.length });
        res.end(pdf);
    }
    async getStudentExaminations(req) {
        return this.authService.getStudentExaminations(req.user?.userId);
    }
    async startStudentExamination(examId, req) {
        return this.authService.startStudentExamination(examId, req.user?.userId);
    }
    async saveStudentAnswers(examId, req, body) {
        return this.authService.saveStudentAnswers(examId, req.user?.userId, body.answers || {});
    }
    async submitStudentExamination(examId, req) {
        return this.authService.submitStudentExamination(examId, req.user?.userId);
    }
};
exports.UserController = UserController;
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT, account_model_1.AccountRole.TEACHER, account_model_1.AccountRole.PRINCIPAL, account_model_1.AccountRole.SYSADMIN),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCurrentUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getStudentDashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Post)('practice/lessons/:lessonId'),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "generateLessonPractice", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Post)('practice/grade'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "gradeLessonPractice", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('report-card'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('grade')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getStudentReportCard", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('report-card/pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('grade')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "downloadStudentReportCard", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Get)('examinations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getStudentExaminations", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Post)('examinations/:examId/start'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "startStudentExamination", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Patch)('examinations/:examId/answers'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "saveStudentAnswers", null);
__decorate([
    (0, roles_decorator_1.Roles)(account_model_1.AccountRole.STUDENT),
    (0, common_1.Post)('examinations/:examId/submit'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "submitStudentExamination", null);
exports.UserController = UserController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, auth_validation_guard_1.AuthValidationGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/user'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], UserController);
//# sourceMappingURL=user.controller.js.map