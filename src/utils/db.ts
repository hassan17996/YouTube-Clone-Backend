// import dotenv from 'dotenv'
// dotenv.config();
import 'dotenv/config';
import {Sequelize} from 'sequelize'

export const sequelize = new Sequelize(
    process.env.DATABASE_NAME!,
    process.env.DATABASE_USER!,
    process.env.DATABASE_PASSWORD!,
    {
        dialect: 'postgres',
        host: 'localhost'
    }
);

export const connectDB = async () => {
  await sequelize.authenticate();
  console.log("Database connected");
};