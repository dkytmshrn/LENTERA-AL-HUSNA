import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  MethodNotAllowedException,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AuthValidationGuard } from '../guards/auth-validation.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AccountRole } from '../models/account.model';
import {
  ApproveRegistrationDto,
  RejectRegistrationDto,
} from '../dto/registration-request.dto';

@UseGuards(JwtAuthGuard, AuthValidationGuard, RolesGuard)
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Roles(AccountRole.SYSADMIN)
  @Get('registration-requests')
  async getRegistrationRequestsForAdmin() {
    return this.authService.getRegistrationRequestsForAdmin();
  }

  @Roles(AccountRole.SYSADMIN)
  @Get('dashboard/stats')
  async getAdminDashboardStats() {
    return this.authService.getAdminDashboardStats();
  }

  @Roles(AccountRole.PRINCIPAL)
  @Get('principal/reports')
  async getPrincipalReportStats() {
    return this.authService.getPrincipalReportStats();
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Get('teacher-options')
  async getTeacherAssignmentOptions() {
    return this.authService.getTeacherAssignmentOptions();
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Get('curriculums/:curriculumId/classrooms')
  async getCurriculumClassrooms(@Param('curriculumId') curriculumId: string) {
    return this.authService.getCurriculumClassrooms(curriculumId);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Put('curriculums/:curriculumId/classrooms')
  async assignCurriculumToClassrooms(@Param('curriculumId') curriculumId: string, @Body() body: { classroomIds?: string[] }) {
    return this.authService.assignCurriculumToClassrooms(curriculumId, body.classroomIds || []);
  }

  @Roles(AccountRole.SYSADMIN)
  @Get('users')
  async getUsersForAdmin(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('searchEmail') searchEmail?: string,
    @Query('searchName') searchName?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getUsersForAdmin({
      role,
      search,
      searchEmail,
      searchName,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Roles(AccountRole.SYSADMIN)
  @Get('users/:id')
  async getUserByIdForAdmin(@Param('id') id: string) {
    const users = (await this.authService.getUsersForAdmin()) as any[];
    const user = users.find((item) => item.id === id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  @Roles(AccountRole.SYSADMIN)
  @Put('users/:id')
  async updateUserForAdmin(@Param('id') id: string, @Body() updateDto: Record<string, any>) {
    return this.authService.updateUserForAdmin(id, updateDto);
  }

  @Roles(AccountRole.SYSADMIN)
  @Patch('users/:id/role')
  async updateUserRoleForAdmin(
    @Param('id') id: string,
    @Body() body: { role?: string; badge?: string },
  ) {
    if (!body.role) {
      throw new BadRequestException('Role is required');
    }

    return this.authService.updateUserRoleForAdmin(id, body.role, body.badge);
  }

  @Roles(AccountRole.SYSADMIN)
  @Delete('users/:id')
  async deleteUserForAdmin(@Param('id') id: string) {
    return this.authService.deleteUserForAdmin(id);
  }

  @Roles(AccountRole.SYSADMIN)
  @Patch('users/:id/badges')
  async updateUserBadges(
    @Param('id') id: string,
    @Body() body: { badges: string[]; mfaCode?: string },
  ) {
    return this.authService.updateUserBadges(id, body.badges, body.mfaCode);
  }

  @Roles(AccountRole.SYSADMIN)
  @Get('badges')
  async getAvailableBadges() {
    return this.authService.getAvailableBadges();
  }

  @Roles(AccountRole.SYSADMIN)
  @Get('approve-registration')
  async approveRegistrationMethodHint() {
    throw new MethodNotAllowedException(
      'Use POST /api/admin/approve-registration with the registration payload to approve a request.',
    );
  }

  @Roles(AccountRole.SYSADMIN)
  @Post('approve-registration')
  async approveRegistration(
    @Req() req: any,
    @Body() approveDto: ApproveRegistrationDto,
  ) {
    const adminId = req.user?.userId || req.user?.sub;
    if (!adminId) {
      throw new BadRequestException('Authenticated admin user is required');
    }

    return this.authService.approveRegistration(approveDto, adminId);
  }

  @Roles(AccountRole.SYSADMIN)
  @Post('reject-registration')
  async rejectRegistration(@Body() rejectDto: RejectRegistrationDto) {
    return this.authService.rejectRegistration(rejectDto);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER, AccountRole.STUDENT)
  @Get('curriculums')
  async getCurriculums(@Req() req: any) {
    return this.authService.getCurriculums(req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @Post('curriculums')
  async createCurriculum(@Body() body: { subjectName: string; gradeLevel: string; year?: number | string; endYear?: number | string | null; teacherIds?: string[]; teacherId?: string }) {
    return this.authService.createCurriculum(body);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @Patch('curriculums/:id')
  async updateCurriculum(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.authService.updateCurriculum(id, body);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @Delete('curriculums/:id')
  async deleteCurriculum(@Param('id') id: string) {
    return this.authService.deleteCurriculum(id);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER, AccountRole.STUDENT)
  @Get('curriculums/:curriculumId/lessons')
  async getCurriculumLessons(@Param('curriculumId') curriculumId: string, @Req() req: any) {
    return this.authService.getCurriculumLessons(curriculumId, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  @Post('curriculums/:curriculumId/lessons')
  async createCurriculumLesson(
    @Param('curriculumId') curriculumId: string,
    @Body() body: { title: string; source?: string; description?: string; week?: string },
    @UploadedFile() file?: Multer.File,
  ) {
    return this.authService.createCurriculumLesson(curriculumId, body, file);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  @Patch('curriculums/:curriculumId/lessons/:lessonId')
  async updateCurriculumLesson(
    @Param('curriculumId') curriculumId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: Record<string, any>,
    @UploadedFile() file?: Multer.File,
  ) {
    return this.authService.updateCurriculumLesson(curriculumId, lessonId, body, file);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @Delete('curriculums/:curriculumId/lessons/:lessonId')
  async deleteCurriculumLesson(
    @Param('curriculumId') curriculumId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.authService.deleteCurriculumLesson(curriculumId, lessonId);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER, AccountRole.STUDENT)
  @Get('curriculums/:curriculumId/examinations')
  async getCurriculumExaminations(@Param('curriculumId') curriculumId: string, @Req() req: any) {
    return this.authService.getCurriculumExaminations(curriculumId, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER, AccountRole.STUDENT)
  @Get('curriculums/:curriculumId/lessons/:lessonId/preview-url')
  async getCurriculumLessonPreviewUrl(
    @Param('curriculumId') curriculumId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return {
      previewUrl: await this.authService.getCurriculumLessonPreviewUrl(curriculumId, lessonId),
    };
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL, AccountRole.TEACHER)
  @Get('examinations/:examId/questions')
  async getExaminationQuestions(@Param('examId') examId: string, @Req() req: any) {
    return this.authService.getExaminationQuestions(examId, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @Post('examinations/generate-questions')
  async generateExaminationQuestions(@Body() body: { subjectName?: string; gradeLevel?: string; multipleChoiceCount?: number; essayCount?: number }) {
    return this.authService.generateExaminationQuestions(body);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'questionImage', maxCount: 1 },
    { name: 'optionImages', maxCount: 4 },
  ]))
  @Post('examinations/:examId/questions')
  async createExaminationQuestion(
    @Param('examId') examId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
    @UploadedFiles() files?: { questionImage?: Multer.File[]; optionImages?: Multer.File[] },
  ) {
    const parsedOptions = body.options ? JSON.parse(body.options) : [];
    const optionImageIndexes = body.optionImageIndexes ? JSON.parse(body.optionImageIndexes) : [];
    return this.authService.createExaminationQuestion(
      examId,
      {
        type: body.type,
        questionText: body.questionText,
        options: parsedOptions,
        optionImageIndexes,
        correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
        points: body.points !== undefined ? Number(body.points) : 1,
        answer: body.answer,
      },
      files?.questionImage?.[0],
      files?.optionImages || [],
      req.user?.userId,
      req.user?.role,
    );
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'questionImage', maxCount: 1 },
    { name: 'optionImages', maxCount: 4 },
  ]))
  @Patch('examinations/:examId/questions/:questionId')
  async updateExaminationQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
    @UploadedFiles() files?: { questionImage?: Multer.File[]; optionImages?: Multer.File[] },
  ) {
    const parsedOptions = body.options ? JSON.parse(body.options) : [];
    const optionImageIndexes = body.optionImageIndexes ? JSON.parse(body.optionImageIndexes) : [];
    return this.authService.updateExaminationQuestion(
      examId,
      questionId,
      {
        type: body.type,
        questionText: body.questionText,
        options: parsedOptions,
        optionImageIndexes,
        existingQuestionImageFileId: body.existingQuestionImageFileId,
        correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
        points: body.points !== undefined ? Number(body.points) : 1,
        answer: body.answer,
      },
      files?.questionImage?.[0],
      files?.optionImages || [],
      req.user?.userId,
      req.user?.role,
    );
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @UseInterceptors(FilesInterceptor('optionImages'))
  @Post('examinations/:examId/questions/with-options-images')
  async createExaminationQuestionWithOptionImages(
    @Param('examId') examId: string,
    @Body() body: Record<string, any>,
    @UploadedFiles() optionImages?: Multer.File[],
  ) {
    const parsedOptions = body.options ? JSON.parse(body.options) : [];
    return this.authService.createExaminationQuestion(
      examId,
      {
        type: body.type,
        questionText: body.questionText,
        options: parsedOptions,
        correctOptionIndex: body.correctOptionIndex !== undefined ? Number(body.correctOptionIndex) : undefined,
        points: body.points !== undefined ? Number(body.points) : 1,
        answer: body.answer,
      },
      undefined,
      optionImages || [],
    );
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @Post('curriculums/:curriculumId/examinations')
  async createCurriculumExamination(
    @Param('curriculumId') curriculumId: string,
    @Body() body: { title: string; examType?: string; description?: string; examDate?: string },
    @Req() req: any,
  ) {
    return this.authService.createCurriculumExamination(curriculumId, body, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @Patch('curriculums/:curriculumId/examinations/:examId')
  async updateCurriculumExamination(
    @Param('curriculumId') curriculumId: string,
    @Param('examId') examId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.authService.updateCurriculumExamination(curriculumId, examId, body, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.TEACHER)
  @Delete('curriculums/:curriculumId/examinations/:examId')
  async deleteCurriculumExamination(
    @Param('curriculumId') curriculumId: string,
    @Param('examId') examId: string,
    @Req() req: any,
  ) {
    return this.authService.deleteCurriculumExamination(curriculumId, examId, req.user?.userId, req.user?.role);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Post('examinations/:examId/approve')
  async approveExamination(@Param('examId') examId: string, @Req() req: any) {
    return this.authService.approveExamination(examId, req.user?.userId);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Post('examinations/:examId/unlock')
  async unlockExamination(@Param('examId') examId: string) {
    return this.authService.unlockExamination(examId);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Get('classrooms')
  async getClassrooms() {
    return this.authService.getClassrooms();
  }

  @Roles(AccountRole.TEACHER)
  @Get('teacher/classroom')
  async getTeacherClassroom(@Req() req: any) {
    return this.authService.getTeacherClassroom(req.user?.userId);
  }

  @Roles(AccountRole.TEACHER)
  @Get('teacher/assignments')
  async getTeacherAssignments(@Req() req: any) {
    return this.authService.getTeacherAssignments(req.user?.userId);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Post('classrooms')
  async createClassroom(@Body() body: { gradeLevel: string; academicPeriod: string; classCode: string; homeroomTeacherId?: string; homeroomTeacherName?: string }) {
    return this.authService.createClassroom(body);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Patch('classrooms/:id')
  async updateClassroom(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.authService.updateClassroom(id, body);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Delete('classrooms/:id')
  async deleteClassroom(@Param('id') id: string) {
    return this.authService.deleteClassroom(id);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Post('classrooms/:id/students')
  async addStudentsToClassroom(@Param('id') id: string, @Body() body: { studentIds: string[] }) {
    return this.authService.addStudentsToClassroom(id, body.studentIds || []);
  }

  @Roles(AccountRole.SYSADMIN, AccountRole.PRINCIPAL)
  @Delete('classrooms/:id/students/:studentId')
  async removeStudentFromClassroom(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.authService.removeStudentFromClassroom(id, studentId);
  }
}
