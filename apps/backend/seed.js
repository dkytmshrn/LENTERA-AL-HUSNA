const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function seed() {
  try {
    // Create sequelize instance
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lentera-al-husna',
      logging: false,
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);

    // Check if admin already exists
    const query = `SELECT * FROM accounts WHERE email = $1`;
    const result = await sequelize.query(query, {
      bind: ['admin@lentera.local'],
      type: Sequelize.QueryTypes.SELECT,
    });

    if (result.length > 0) {
      console.log('✓ SysAdmin account already exists');
      await sequelize.close();
      process.exit(0);
    }

    // Create SysAdmin account
    const insertQuery = `
      INSERT INTO accounts (
        id, name, "fullName", badge, role, email, password, 
        gender, status, "emailVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    await sequelize.query(insertQuery, {
      bind: [
        uuidv4(),
        'admin',
        'System Administrator',
        'admin',
        'SysAdmin',
        'admin@lentera.local',
        hashedPassword,
        'Male',
        'Active',
        true,
        new Date(),
        new Date(),
      ],
    });

    console.log('✓ SysAdmin account created successfully');
    console.log('\n📊 SysAdmin Account Details:');
    console.log('   Email: admin@lentera.local');
    console.log('   Password: Admin@1234');
    console.log('   Role: SysAdmin');
    console.log('   Status: Active');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
