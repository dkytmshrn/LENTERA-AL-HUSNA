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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const sequelize_typescript_1 = require("sequelize-typescript");
const auth_controller_1 = require("./controllers/auth.controller");
const admin_controller_1 = require("./controllers/admin.controller");
const user_controller_1 = require("./controllers/user.controller");
const auth_service_1 = require("./services/auth.service");
const email_service_1 = require("./services/email.service");
const gcs_service_1 = require("./services/gcs.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const account_model_1 = require("./models/account.model");
const class_model_1 = require("./models/class.model");
const registration_request_model_1 = require("./models/registration-request.model");
const curriculum_model_1 = require("./models/curriculum.model");
const curriculum_detail_model_1 = require("./models/curriculum-detail.model");
const classroom_model_1 = require("./models/classroom.model");
const backendEnvPath = path.resolve(process.cwd(), 'apps/backend/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath });
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [backendEnvPath, rootEnvPath, '.env'],
            }),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_ACCESS_SECRET,
                signOptions: { expiresIn: '15m' },
            }),
        ],
        controllers: [auth_controller_1.AuthController, admin_controller_1.AdminController, user_controller_1.UserController],
        providers: [
            auth_service_1.AuthService,
            email_service_1.EmailService,
            gcs_service_1.GcsService,
            jwt_strategy_1.JwtStrategy,
            jwt_strategy_1.JwtRefreshStrategy,
            {
                provide: sequelize_typescript_1.Sequelize,
                useFactory: async () => {
                    const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
                    const sequelize = new sequelize_typescript_1.Sequelize({
                        dialect: 'postgres',
                        host: process.env.DB_HOST || 'localhost',
                        port: dbPort,
                        username: process.env.DB_USERNAME || 'postgres',
                        password: process.env.DB_PASSWORD,
                        database: process.env.DB_NAME || 'lentera-al-husna',
                        models: [account_model_1.Account, class_model_1.Class, registration_request_model_1.RegistrationRequest, curriculum_model_1.Curriculum, curriculum_detail_model_1.CurriculumLesson, curriculum_detail_model_1.CurriculumExamination, curriculum_detail_model_1.ExaminationQuestion, curriculum_detail_model_1.ExaminationAttempt, classroom_model_1.Classroom, classroom_model_1.ClassroomStudent, classroom_model_1.ClassroomCurriculum],
                        logging: false,
                    });
                    await sequelize.authenticate();
                    console.log('Database connection established successfully');
                    return sequelize;
                },
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map