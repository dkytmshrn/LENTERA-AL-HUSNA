'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const curriculumsInfo = await queryInterface.describeTable('curriculums');

    if (!curriculumsInfo.year) {
      await queryInterface.addColumn('curriculums', 'year', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: () => new Date().getFullYear(),
      });
    }
  },

  async down(queryInterface) {
    const curriculumsInfo = await queryInterface.describeTable('curriculums');

    if (curriculumsInfo.year) {
      await queryInterface.removeColumn('curriculums', 'year');
    }
  },
};
