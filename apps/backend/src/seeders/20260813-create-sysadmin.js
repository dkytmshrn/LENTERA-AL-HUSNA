'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const hashedPassword = await bcrypt.hash('Admin@1234', 12);

    return queryInterface.bulkInsert('accounts', [
      {
        id: uuidv4(),
        name: 'admin',
        fullName: 'System Administrator',
        badge: 'admin',
        role: 'SysAdmin',
        email: 'admin@lentera.local',
        password: hashedPassword,
        gender: 'Male',
        status: 'Active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('accounts', {
      email: 'admin@lentera.local',
    });
  },
};
