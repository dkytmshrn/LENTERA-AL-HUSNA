'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('classrooms', ['gradeLevel', 'classCode', 'academicPeriod'], {
      unique: true,
      name: 'classrooms_grade_code_period_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('classrooms', 'classrooms_grade_code_period_unique');
  },
};