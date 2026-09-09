'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('examination_questions', 'questionImageExtension', { type: Sequelize.STRING(10), allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('examination_questions', 'questionImageExtension');
  },
};