'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');
    if (!lessonsInfo.source) {
      await queryInterface.addColumn('curriculum_lessons', 'source', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    const examsInfo = await queryInterface.describeTable('curriculum_examinations');
    if (!examsInfo.examType) {
      await queryInterface.addColumn('curriculum_examinations', 'examType', {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: 'Examination',
      });
    }
  },

  async down(queryInterface) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');
    if (lessonsInfo.source) {
      await queryInterface.removeColumn('curriculum_lessons', 'source');
    }

    const examsInfo = await queryInterface.describeTable('curriculum_examinations');
    if (examsInfo.examType) {
      await queryInterface.removeColumn('curriculum_examinations', 'examType');
    }
  },
};
