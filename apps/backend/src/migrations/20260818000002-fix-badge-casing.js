'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fix lowercase badge names to proper casing
      await queryInterface.sequelize.query(
        `UPDATE accounts 
         SET badge = CASE 
           WHEN badge = 'siswa' THEN 'Siswa'
           WHEN badge = 'guru' THEN 'Guru'
           WHEN badge = 'wali kelas' THEN 'Wali Kelas'
           WHEN badge = 'kepala sekolah' THEN 'Kepala Sekolah'
           WHEN badge = 'wakil kepala sekolah' THEN 'Wakil Kepala Sekolah'
           WHEN badge = 'tu' THEN 'TU'
           ELSE badge
         END
         WHERE badge IS NOT NULL AND badge != ''`,
        { transaction }
      );

      await transaction.commit();
      console.log('✓ Fixed badge casing for all users');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback is not recommended for data fixes, but provided for completeness
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `UPDATE accounts 
         SET badge = LOWER(badge)
         WHERE badge IS NOT NULL AND badge != ''`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
