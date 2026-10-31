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
        host: process.env.DATABASE_HOST || "localhost",
        port: Number(process.env.DATABASE_PORT) || 5432,
        logging: console.log,
    }
);

// export const connectDB = async () => {
//   await sequelize.authenticate();
//   console.log("Database connected");
// };

export const connectDB = async () => {
  await sequelize.authenticate();

  const [result] = await sequelize.query(`
    SELECT
      current_database() AS database,
      current_user AS username,
      inet_server_addr() AS host,
      inet_server_port() AS port
  `);

  console.log('Application DB:', result);
};