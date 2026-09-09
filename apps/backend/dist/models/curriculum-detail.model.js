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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExaminationQuestion = exports.ExaminationAttempt = exports.CurriculumExamination = exports.CurriculumLesson = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const curriculum_model_1 = require("./curriculum.model");
const account_model_1 = require("./account.model");
let CurriculumLesson = class CurriculumLesson extends sequelize_typescript_1.Model {
};
exports.CurriculumLesson = CurriculumLesson;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => curriculum_model_1.Curriculum),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "curriculumId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "source", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "week", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "fileId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        allowNull: true,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CurriculumLesson.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumLesson.prototype, "originalFileName", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => curriculum_model_1.Curriculum),
    __metadata("design:type", curriculum_model_1.Curriculum)
], CurriculumLesson.prototype, "curriculum", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CurriculumLesson.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CurriculumLesson.prototype, "updatedAt", void 0);
exports.CurriculumLesson = CurriculumLesson = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'curriculum_lessons',
        timestamps: true,
    })
], CurriculumLesson);
let CurriculumExamination = class CurriculumExamination extends sequelize_typescript_1.Model {
};
exports.CurriculumExamination = CurriculumExamination;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => curriculum_model_1.Curriculum),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "curriculumId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(80),
        allowNull: false,
        defaultValue: 'Regular Examination',
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "examType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "examDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TIME,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "examStartTime", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TIME,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "examEndTime", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM('draft', 'approved'), allowNull: false, defaultValue: 'draft' }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "approvalStatus", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: true }),
    __metadata("design:type", Date)
], CurriculumExamination.prototype, "approvedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], CurriculumExamination.prototype, "approvedBy", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => curriculum_model_1.Curriculum),
    __metadata("design:type", curriculum_model_1.Curriculum)
], CurriculumExamination.prototype, "curriculum", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CurriculumExamination.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CurriculumExamination.prototype, "updatedAt", void 0);
exports.CurriculumExamination = CurriculumExamination = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'curriculum_examinations',
        timestamps: true,
    })
], CurriculumExamination);
let ExaminationAttempt = class ExaminationAttempt extends sequelize_typescript_1.Model {
};
exports.ExaminationAttempt = ExaminationAttempt;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, defaultValue: sequelize_typescript_1.DataType.UUIDV4, primaryKey: true }),
    __metadata("design:type", String)
], ExaminationAttempt.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CurriculumExamination),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], ExaminationAttempt.prototype, "examinationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => account_model_1.Account),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], ExaminationAttempt.prototype, "studentId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM('in_progress', 'submitted', 'expired'), allowNull: false, defaultValue: 'in_progress' }),
    __metadata("design:type", String)
], ExaminationAttempt.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: false, defaultValue: {} }),
    __metadata("design:type", Object)
], ExaminationAttempt.prototype, "answers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: false }),
    __metadata("design:type", Date)
], ExaminationAttempt.prototype, "startedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: true }),
    __metadata("design:type", Date)
], ExaminationAttempt.prototype, "submittedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], ExaminationAttempt.prototype, "score", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], ExaminationAttempt.prototype, "rawScore", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], ExaminationAttempt.prototype, "maxScore", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: true }),
    __metadata("design:type", Boolean)
], ExaminationAttempt.prototype, "passed", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: false, defaultValue: {} }),
    __metadata("design:type", Object)
], ExaminationAttempt.prototype, "questionResults", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: false, defaultValue: {} }),
    __metadata("design:type", Object)
], ExaminationAttempt.prototype, "questionOrder", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM('complete', 'pending_ai'), allowNull: false, defaultValue: 'complete' }),
    __metadata("design:type", String)
], ExaminationAttempt.prototype, "gradingStatus", void 0);
exports.ExaminationAttempt = ExaminationAttempt = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'examination_attempts', timestamps: true })
], ExaminationAttempt);
let ExaminationQuestion = class ExaminationQuestion extends sequelize_typescript_1.Model {
};
exports.ExaminationQuestion = ExaminationQuestion;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CurriculumExamination),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "examinationId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('essay', 'multiple_choice'),
        allowNull: false,
        defaultValue: 'essay',
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "questionText", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "questionImageFileId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "questionImageUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(10), allowNull: true }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "questionImageExtension", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSON,
        allowNull: true,
    }),
    __metadata("design:type", Array)
], ExaminationQuestion.prototype, "options", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], ExaminationQuestion.prototype, "correctOptionIndex", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
        defaultValue: 1,
    }),
    __metadata("design:type", Number)
], ExaminationQuestion.prototype, "points", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
        comment: 'Correct answer for the question (for essay or reference)',
    }),
    __metadata("design:type", String)
], ExaminationQuestion.prototype, "answer", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CurriculumExamination),
    __metadata("design:type", CurriculumExamination)
], ExaminationQuestion.prototype, "examination", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ExaminationQuestion.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ExaminationQuestion.prototype, "updatedAt", void 0);
exports.ExaminationQuestion = ExaminationQuestion = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'examination_questions',
        timestamps: true,
    })
], ExaminationQuestion);
//# sourceMappingURL=curriculum-detail.model.js.map