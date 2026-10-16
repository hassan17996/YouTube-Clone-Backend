import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../utils/db.js";

export class Subscription extends Model<
  InferAttributes<Subscription>,
  InferCreationAttributes<Subscription>
> {
  declare id: CreationOptional<number>;
  declare subscriberId: number;
  declare channelId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Subscription.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subscriberId: { type: DataTypes.INTEGER, allowNull: false },
    channelId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "subscriptions", underscored: true, timestamps: true },
);
