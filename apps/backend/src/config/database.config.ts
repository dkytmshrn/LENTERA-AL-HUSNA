import { Sequelize } from 'sequelize-typescript';
import * as dotenv from 'dotenv';
import { Account } from '../models/account.model';
import { Class } from '../models/class.model';
import { RegistrationRequest } from '../models/registration-request.model';

dotenv.config();

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: dbPort,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'lentera-al-husna',
        models: [Account, Class, RegistrationRequest],
        logging: process.env.NODE_ENV !== 'production' ? console.log : false,
      });
      await sequelize.authenticate();
      console.log('Database connection established successfully');
      return sequelize;
    },
  },
];
