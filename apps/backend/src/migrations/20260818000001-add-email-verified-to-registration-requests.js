'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column already exists
    const table = await queryInterface.describeTable('registration_requests');
    
    if (!table.emailVerified) {
      await queryInterface.addColumn('registration_requests', 'emailVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('registration_requests');
    
    if (table.emailVerified) {
      await queryInterface.removeColumn('registration_requests', 'emailVerified');
    }
  },
};
