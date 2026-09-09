'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('curriculums', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subjectName: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      gradeLevel: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      teacherId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      teacherName: {
        type: Sequelize.STRING(255),
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

    await queryInterface.createTable('classrooms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      gradeLevel: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      academicPeriod: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      classCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      homeroomTeacherId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      homeroomTeacherName: {
        type: Sequelize.STRING(255),
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

    await queryInterface.createTable('classroom_students', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      classroomId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classrooms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('classroom_students');
    await queryInterface.dropTable('classrooms');
    await queryInterface.dropTable('curriculums');
  },
};
