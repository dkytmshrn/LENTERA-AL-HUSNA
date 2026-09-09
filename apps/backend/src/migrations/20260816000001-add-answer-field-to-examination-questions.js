'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('examination_questions');
    if (!tableExists) {
      return;
    }

    const columnExists = await queryInterface.describeTable('examination_questions').then((table) => {
      return !!table.answer;
    }).catch(() => false);

    if (!columnExists) {
      await queryInterface.addColumn('examination_questions', 'answer', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Correct answer for the question (for essay or reference)',
      });
    }
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.tableExists('examination_questions');
    if (tableExists) {
      await queryInterface.removeColumn('examination_questions', 'answer');
    }
  },
};
