'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const accounts = await queryInterface.describeTable('accounts');
    if (accounts.phoneNumber && !accounts.phoneNumber.unique) {
      await queryInterface.addIndex('accounts', ['phoneNumber'], {
        unique: true,
        name: 'accounts_phone_number_unique',
      });
    }

    const requests = await queryInterface.describeTable('registration_requests');
    if (!requests.approvalOtpHash) {
      await queryInterface.addColumn('registration_requests', 'approvalOtpHash', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!requests.approvalOtpExpiresAt) {
      await queryInterface.addColumn('registration_requests', 'approvalOtpExpiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('accounts', 'accounts_phone_number_unique');
    await queryInterface.removeColumn('registration_requests', 'approvalOtpExpiresAt');
    await queryInterface.removeColumn('registration_requests', 'approvalOtpHash');
  },
};