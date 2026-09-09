'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const curriculumsInfo = await queryInterface.describeTable('curriculums');

    if (!curriculumsInfo.endYear) {
      await queryInterface.addColumn('curriculums', 'endYear', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const curriculumsInfo = await queryInterface.describeTable('curriculums');

    if (curriculumsInfo.endYear) {
      await queryInterface.removeColumn('curriculums', 'endYear');
    }
  },
};
