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
exports.ClassroomCurriculum = exports.ClassroomStudent = exports.Classroom = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const account_model_1 = require("./account.model");
const curriculum_model_1 = require("./curriculum.model");
let Classroom = class Classroom extends sequelize_typescript_1.Model {
};
exports.Classroom = Classroom;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(20),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "gradeLevel", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "academicPeriod", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "classCode", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => account_model_1.Account),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "homeroomTeacherId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], Classroom.prototype, "homeroomTeacherName", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Classroom.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Classroom.prototype, "updatedAt", void 0);
exports.Classroom = Classroom = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'classrooms',
        timestamps: true,
    })
], Classroom);
let ClassroomStudent = class ClassroomStudent extends sequelize_typescript_1.Model {
};
exports.ClassroomStudent = ClassroomStudent;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], ClassroomStudent.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Classroom),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], ClassroomStudent.prototype, "classroomId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => account_model_1.Account),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], ClassroomStudent.prototype, "studentId", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ClassroomStudent.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ClassroomStudent.prototype, "updatedAt", void 0);
exports.ClassroomStudent = ClassroomStudent = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'classroom_students',
        timestamps: true,
    })
], ClassroomStudent);
let ClassroomCurriculum = class ClassroomCurriculum extends sequelize_typescript_1.Model {
};
exports.ClassroomCurriculum = ClassroomCurriculum;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, defaultValue: sequelize_typescript_1.DataType.UUIDV4, primaryKey: true }),
    __metadata("design:type", String)
], ClassroomCurriculum.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Classroom),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], ClassroomCurriculum.prototype, "classroomId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => curriculum_model_1.Curriculum),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], ClassroomCurriculum.prototype, "curriculumId", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ClassroomCurriculum.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ClassroomCurriculum.prototype, "updatedAt", void 0);
exports.ClassroomCurriculum = ClassroomCurriculum = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'classroom_curriculums', timestamps: true })
], ClassroomCurriculum);
//# sourceMappingURL=classroom.model.js.map