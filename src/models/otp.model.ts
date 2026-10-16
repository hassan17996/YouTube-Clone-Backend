import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../utils/db.js";

export class Otp extends Model<InferAttributes<Otp>, InferCreationAttributes<Otp>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare otp: string;
  declare type: "signup" | "reset_password";
  declare expiresAt: Date;
}

Otp.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    otp: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(30), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "otps", underscored: true, timestamps: false }
);