'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('curriculums');

    if (!tableInfo.teacherIds) {
      await queryInterface.addColumn('curriculums', 'teacherIds', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.teacherNames) {
      await queryInterface.addColumn('curriculums', 'teacherNames', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (tableInfo.teacherId && !tableInfo.teacherIds) {
      await queryInterface.sequelize.query(`
        UPDATE curriculums
        SET "teacherIds" = CASE
          WHEN "teacherId" IS NULL OR TRIM("teacherId"::text) = '' THEN NULL
          ELSE "teacherId"::text
        END
        WHERE "teacherId" IS NOT NULL OR TRIM("teacherId"::text) = ''
      `);
    }

    if (tableInfo.teacherName && !tableInfo.teacherNames) {
      await queryInterface.sequelize.query(`
        UPDATE curriculums
        SET "teacherNames" = CASE
          WHEN "teacherName" IS NULL OR TRIM("teacherName") = '' THEN NULL
          ELSE "teacherName"
        END
        WHERE "teacherName" IS NOT NULL OR TRIM(COALESCE("teacherName", '')) = ''
      `);
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('curriculums');

    if (tableInfo.teacherIds) {
      await queryInterface.removeColumn('curriculums', 'teacherIds');
    }

    if (tableInfo.teacherNames) {
      await queryInterface.removeColumn('curriculums', 'teacherNames');
    }
  },
};
