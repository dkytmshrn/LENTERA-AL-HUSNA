import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import 'pg';
import { Sequelize } from 'sequelize-typescript';
import { AuthController } from './controllers/auth.controller';
import { AdminController } from './controllers/admin.controller';
import { UserController } from './controllers/user.controller';
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { GcsService } from './services/gcs.service';
import { JwtStrategy, JwtRefreshStrategy } from './strategies/jwt.strategy';
import { Account } from './models/account.model';
import { Class } from './models/class.model';
import { RegistrationRequest } from './models/registration-request.model';
import { Curriculum } from './models/curriculum.model';
import { CurriculumLesson, CurriculumExamination, ExaminationQuestion, ExaminationAttempt } from './models/curriculum-detail.model';
import { Classroom, ClassroomStudent, ClassroomCurriculum } from './models/classroom.model';

const backendEnvPath = path.resolve(process.cwd(), 'apps/backend/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [backendEnvPath, rootEnvPath, '.env'],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, AdminController, UserController],
  providers: [
    AuthService,
    EmailService,
    GcsService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: Sequelize,
      useFactory: async () => {
        const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
        const sequelize = new Sequelize({
          dialect: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: dbPort,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'lentera-al-husna',
          models: [Account, Class, RegistrationRequest, Curriculum, CurriculumLesson, CurriculumExamination, ExaminationQuestion, ExaminationAttempt, Classroom, ClassroomStudent, ClassroomCurriculum],
          logging: false,
        });
        await sequelize.authenticate();
        console.log('Database connection established successfully');
        return sequelize;
      },
    },
  ],
})
export class AppModule {}
