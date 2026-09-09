'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('registration_requests');

    if (!tableInfo.otpResendCount) {
      await queryInterface.addColumn('registration_requests', 'otpResendCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!tableInfo.lastOtpSentAt) {
      await queryInterface.addColumn('registration_requests', 'lastOtpSentAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('registration_requests');

    if (tableInfo.lastOtpSentAt) {
      await queryInterface.removeColumn('registration_requests', 'lastOtpSentAt');
    }

    if (tableInfo.otpResendCount) {
      await queryInterface.removeColumn('registration_requests', 'otpResendCount');
    }
  },
};
