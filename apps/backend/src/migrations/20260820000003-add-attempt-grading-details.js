'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('examination_attempts', 'questionResults', { type: Sequelize.JSON, allowNull: false, defaultValue: {} });
    await queryInterface.addColumn('examination_attempts', 'gradingStatus', { type: Sequelize.ENUM('complete', 'pending_ai'), allowNull: false, defaultValue: 'complete' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('examination_attempts', 'gradingStatus');
    await queryInterface.removeColumn('examination_attempts', 'questionResults');
  },
};