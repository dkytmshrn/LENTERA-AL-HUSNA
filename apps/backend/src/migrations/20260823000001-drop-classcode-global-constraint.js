'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE classrooms
      DROP CONSTRAINT IF EXISTS "classrooms_classCode_key";
    `);
  },

  async down() {
    // The class code must not be globally unique.
  },
};