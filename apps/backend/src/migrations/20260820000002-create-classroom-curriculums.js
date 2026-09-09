'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classroom_curriculums', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      classroomId: { type: Sequelize.UUID, allowNull: false, references: { model: 'classrooms', key: 'id' }, onDelete: 'CASCADE' },
      curriculumId: { type: Sequelize.UUID, allowNull: false, references: { model: 'curriculums', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('classroom_curriculums', ['classroomId', 'curriculumId'], { unique: true, name: 'classroom_curriculums_unique_assignment' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('classroom_curriculums', 'classroom_curriculums_unique_assignment');
    await queryInterface.dropTable('classroom_curriculums');
  },
};