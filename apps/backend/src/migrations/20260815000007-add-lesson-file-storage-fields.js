'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');

    if (!lessonsInfo.fileId) {
      await queryInterface.addColumn('curriculum_lessons', 'fileId', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      });
    }

    if (!lessonsInfo.fileSizeBytes) {
      await queryInterface.addColumn('curriculum_lessons', 'fileSizeBytes', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      });
    }

    if (!lessonsInfo.originalFileName) {
      await queryInterface.addColumn('curriculum_lessons', 'originalFileName', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');

    if (lessonsInfo.fileId) {
      await queryInterface.removeColumn('curriculum_lessons', 'fileId');
    }

    if (lessonsInfo.fileSizeBytes) {
      await queryInterface.removeColumn('curriculum_lessons', 'fileSizeBytes');
    }

    if (lessonsInfo.originalFileName) {
      await queryInterface.removeColumn('curriculum_lessons', 'originalFileName');
    }
  },
};
