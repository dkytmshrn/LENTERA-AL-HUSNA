'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const examsInfo = await queryInterface.describeTable('curriculum_examinations');

    if (!examsInfo.examType) {
      await queryInterface.addColumn('curriculum_examinations', 'examType', {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: 'Regular Examination',
      });
    }

    if (!examsInfo.examStartTime) {
      await queryInterface.addColumn('curriculum_examinations', 'examStartTime', {
        type: Sequelize.TIME,
        allowNull: true,
      });
    }

    if (!examsInfo.examEndTime) {
      await queryInterface.addColumn('curriculum_examinations', 'examEndTime', {
        type: Sequelize.TIME,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const examsInfo = await queryInterface.describeTable('curriculum_examinations');

    if (examsInfo.examType) {
      await queryInterface.removeColumn('curriculum_examinations', 'examType');
    }

    if (examsInfo.examStartTime) {
      await queryInterface.removeColumn('curriculum_examinations', 'examStartTime');
    }

    if (examsInfo.examEndTime) {
      await queryInterface.removeColumn('curriculum_examinations', 'examEndTime');
    }
  },
};
