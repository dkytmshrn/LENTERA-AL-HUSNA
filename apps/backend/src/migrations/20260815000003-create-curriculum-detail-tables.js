'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const curriculumLessonExists = await queryInterface.tableExists('curriculum_lessons');
    if (!curriculumLessonExists) {
      await queryInterface.createTable('curriculum_lessons', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        curriculumId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'curriculums',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        week: {
          type: Sequelize.STRING(50),
          allowNull: true,
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

    const curriculumExamExists = await queryInterface.tableExists('curriculum_examinations');
    if (!curriculumExamExists) {
      await queryInterface.createTable('curriculum_examinations', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        curriculumId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'curriculums',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        examDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
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
    await queryInterface.dropTable('curriculum_examinations');
    await queryInterface.dropTable('curriculum_lessons');
  },
};
