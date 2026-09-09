'use strict';

module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.removeIndex('registration_requests', ['email']);
    } catch (error) {
      // Ignore when the index has already been removed or does not exist.
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.addIndex('registration_requests', ['email'], {
        unique: true,
        name: 'registration_requests_email_key',
      });
    } catch (error) {
      // Ignore when the index already exists.
    }
  },
};
