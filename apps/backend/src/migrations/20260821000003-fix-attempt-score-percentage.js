'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('examination_attempts', 'score', { type: Sequelize.FLOAT, allowNull: true });
    await queryInterface.addColumn('examination_attempts', 'rawScore', { type: Sequelize.FLOAT, allowNull: true });
    await queryInterface.addColumn('examination_attempts', 'maxScore', { type: Sequelize.FLOAT, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('examination_attempts', 'maxScore');
    await queryInterface.removeColumn('examination_attempts', 'rawScore');
    await queryInterface.changeColumn('examination_attempts', 'score', { type: Sequelize.INTEGER, allowNull: true });
  },
};