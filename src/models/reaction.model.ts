import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../utils/db.js";

export class Reaction extends Model<InferAttributes<Reaction>, InferCreationAttributes<Reaction>> {
  declare id: CreationOptional<number>;
  declare type: "like" | "dislike";
  declare userId: number;
  declare videoId: number;
}

Reaction.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [["like", "dislike"]] } },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    videoId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "reactions", underscored: true, timestamps: false }
);