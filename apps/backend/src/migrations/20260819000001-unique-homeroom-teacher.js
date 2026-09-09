module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('classrooms', ['homeroomTeacherId'], {
      name: 'classrooms_homeroom_teacher_unique',
      unique: true,
      where: { homeroomTeacherId: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('classrooms', 'classrooms_homeroom_teacher_unique');
  },
};