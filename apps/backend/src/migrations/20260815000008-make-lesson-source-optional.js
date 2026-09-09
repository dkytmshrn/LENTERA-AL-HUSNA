'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');

    if (lessonsInfo.source) {
      await queryInterface.changeColumn('curriculum_lessons', 'source', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const lessonsInfo = await queryInterface.describeTable('curriculum_lessons');

    if (lessonsInfo.source) {
      await queryInterface.changeColumn('curriculum_lessons', 'source', {
        type: Sequelize.TEXT,
        allowNull: false,
      });
    }
  },
};
