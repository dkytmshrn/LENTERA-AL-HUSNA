'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('examination_questions');
    if (!tableExists) {
      await queryInterface.createTable('examination_questions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        examinationId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'curriculum_examinations',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        type: {
          type: Sequelize.ENUM('essay', 'multiple_choice'),
          allowNull: false,
          defaultValue: 'essay',
        },
        questionText: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        questionImageFileId: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        questionImageUrl: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        options: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        correctOptionIndex: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        points: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('examination_questions');
  },
};
