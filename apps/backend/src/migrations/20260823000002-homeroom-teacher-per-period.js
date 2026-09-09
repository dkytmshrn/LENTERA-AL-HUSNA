'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex('classrooms', 'classrooms_homeroom_teacher_unique');
    await queryInterface.addIndex('classrooms', ['homeroomTeacherId', 'academicPeriod'], {
      name: 'classrooms_homeroom_teacher_period_unique',
      unique: true,
      where: { homeroomTeacherId: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('classrooms', 'classrooms_homeroom_teacher_period_unique');
    await queryInterface.addIndex('classrooms', ['homeroomTeacherId'], {
      name: 'classrooms_homeroom_teacher_unique',
      unique: true,
      where: { homeroomTeacherId: { [Sequelize.Op.ne]: null } },
    });
  },
};