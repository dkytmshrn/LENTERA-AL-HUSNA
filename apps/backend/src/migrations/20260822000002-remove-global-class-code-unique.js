'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE constraint_record RECORD;
      BEGIN
        FOR constraint_record IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE t.relname = 'classrooms'
            AND n.nspname = current_schema()
            AND c.contype = 'u'
            AND pg_get_constraintdef(c.oid) LIKE '%(classCode)%'
        LOOP
          EXECUTE format('ALTER TABLE classrooms DROP CONSTRAINT %I', constraint_record.conname);
        END LOOP;
      END $$;
    `);
  },

  async down() {
    // The original global classCode uniqueness is intentionally not restored.
  },
};
