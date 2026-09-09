import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AuthValidationGuard } from '../guards/auth-validation.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AccountRole } from '../models/account.model';
import { Roles } from '../decorators/roles.decorator';
import { AuthService } from '../services/auth.service';

@UseGuards(JwtAuthGuard, AuthValidationGuard, RolesGuard)
@Controller('api/user')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Roles(AccountRole.STUDENT, AccountRole.TEACHER, AccountRole.PRINCIPAL, AccountRole.SYSADMIN)
  @Get('me')
  async getCurrentUser(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const users = (await this.authService.getUsersForAdmin()) as any[];
    const user = users.find((item) => item.id === userId);
    return user || { id: userId };
  }

  @Roles(AccountRole.STUDENT)
  @Get('dashboard')
  async getStudentDashboard(@Req() req: any) {
    return this.authService.getStudentDashboard(req.user?.userId);
  }

  @Roles(AccountRole.STUDENT)
  @Post('practice/lessons/:lessonId')
  async generateLessonPractice(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.authService.generateLessonPractice(lessonId, req.user?.userId);
  }

  @Roles(AccountRole.STUDENT)
  @Post('practice/grade')
  async gradeLessonPractice(@Body() body: { questions?: any[]; answers?: Record<number, string> }) {
    return this.authService.gradeLessonPractice(body.questions || [], body.answers || {});
  }

  @Roles(AccountRole.STUDENT)
  @Get('report-card')
  async getStudentReportCard(@Req() req: any, @Query('grade') grade?: string) {
    return this.authService.getStudentReportCard(req.user?.userId, grade);
  }

  @Roles(AccountRole.STUDENT)
  @Get('report-card/pdf')
  async downloadStudentReportCard(@Req() req: any, @Res() res: Response, @Query('grade') grade?: string) {
    const pdf = await this.authService.generateStudentReportCardPdf(req.user?.userId, grade);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rapor-mts-al-husna-lentera.pdf"', 'Content-Length': pdf.length });
    res.end(pdf);
  }

  @Roles(AccountRole.STUDENT)
  @Get('examinations')
  async getStudentExaminations(@Req() req: any) {
    return this.authService.getStudentExaminations(req.user?.userId);
  }

  @Roles(AccountRole.STUDENT)
  @Post('examinations/:examId/start')
  async startStudentExamination(@Param('examId') examId: string, @Req() req: any) {
    return this.authService.startStudentExamination(examId, req.user?.userId);
  }

  @Roles(AccountRole.STUDENT)
  @Patch('examinations/:examId/answers')
  async saveStudentAnswers(@Param('examId') examId: string, @Req() req: any, @Body() body: { answers?: Record<string, unknown> }) {
    return this.authService.saveStudentAnswers(examId, req.user?.userId, body.answers || {});
  }

  @Roles(AccountRole.STUDENT)
  @Post('examinations/:examId/submit')
  async submitStudentExamination(@Param('examId') examId: string, @Req() req: any) {
    return this.authService.submitStudentExamination(examId, req.user?.userId);
  }
}
