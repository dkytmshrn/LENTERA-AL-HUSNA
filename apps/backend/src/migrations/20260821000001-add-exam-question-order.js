'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('examination_attempts', 'questionOrder', { type: Sequelize.JSON, allowNull: false, defaultValue: {} });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('examination_attempts', 'questionOrder');
  },
};