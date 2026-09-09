'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('curriculum_examinations', 'approvalStatus', {
      type: Sequelize.ENUM('draft', 'approved'), allowNull: false, defaultValue: 'draft',
    });
    await queryInterface.addColumn('curriculum_examinations', 'approvedAt', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('curriculum_examinations', 'approvedBy', { type: Sequelize.UUID, allowNull: true });

    await queryInterface.createTable('examination_attempts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      examinationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'curriculum_examinations', key: 'id' }, onDelete: 'CASCADE' },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'accounts', key: 'id' }, onDelete: 'CASCADE' },
      status: { type: Sequelize.ENUM('in_progress', 'submitted', 'expired'), allowNull: false, defaultValue: 'in_progress' },
      answers: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      startedAt: { type: Sequelize.DATE, allowNull: false },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      score: { type: Sequelize.INTEGER, allowNull: true },
      passed: { type: Sequelize.BOOLEAN, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('examination_attempts', ['examinationId', 'studentId'], { unique: true, name: 'examination_attempts_one_per_student' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('examination_attempts', 'examination_attempts_one_per_student');
    await queryInterface.dropTable('examination_attempts');
    await queryInterface.removeColumn('curriculum_examinations', 'approvedBy');
    await queryInterface.removeColumn('curriculum_examinations', 'approvedAt');
    await queryInterface.removeColumn('curriculum_examinations', 'approvalStatus');
  },
};