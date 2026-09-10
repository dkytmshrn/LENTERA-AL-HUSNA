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
exports.Account = exports.AccountGender = exports.AccountStatus = exports.AccountRole = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
var AccountRole;
(function (AccountRole) {
    AccountRole["GUEST"] = "Guest";
    AccountRole["STUDENT"] = "Student";
    AccountRole["TEACHER"] = "Teacher";
    AccountRole["PRINCIPAL"] = "Principal";
    AccountRole["SYSADMIN"] = "SysAdmin";
})(AccountRole || (exports.AccountRole = AccountRole = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["PENDING"] = "Pending";
    AccountStatus["ACTIVE"] = "Active";
    AccountStatus["INACTIVE"] = "Inactive";
    AccountStatus["SUSPENDED"] = "Suspended";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var AccountGender;
(function (AccountGender) {
    AccountGender["MALE"] = "Male";
    AccountGender["FEMALE"] = "Female";
})(AccountGender || (exports.AccountGender = AccountGender = {}));
let Account = class Account extends sequelize_typescript_1.Model {
};
exports.Account = Account;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "fullName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
    }),
    __metadata("design:type", String)
], Account.prototype, "badge", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(AccountRole.GUEST),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(AccountRole)),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "role", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
    }),
    __metadata("design:type", Date)
], Account.prototype, "birthday", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(AccountGender.MALE),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(AccountGender)),
    }),
    __metadata("design:type", String)
], Account.prototype, "gender", void 0);
__decorate([
    sequelize_typescript_1.Unique,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "password", void 0);
__decorate([
    sequelize_typescript_1.Unique,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(20),
    }),
    __metadata("design:type", String)
], Account.prototype, "phoneNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], Account.prototype, "parentName", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(AccountStatus.PENDING),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(AccountStatus)),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Account.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], Account.prototype, "passwordResetToken", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], Account.prototype, "passwordResetExpires", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], Account.prototype, "refreshToken", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], Account.prototype, "refreshTokenExpiresAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], Account.prototype, "emailVerified", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], Account.prototype, "lastLoginAt", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Account.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Account.prototype, "updatedAt", void 0);
exports.Account = Account = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'accounts',
        timestamps: true,
    })
], Account);
//# sourceMappingURL=account.model.js.map