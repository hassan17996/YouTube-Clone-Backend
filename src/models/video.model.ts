import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../utils/db.js";

export class Video extends Model<
  InferAttributes<Video>,
  InferCreationAttributes<Video>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare videoUrl: CreationOptional<string | null>;
  declare thumbnailUrl: CreationOptional<string | null>;
  declare views: CreationOptional<number>;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Video.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    videoUrl: { type: DataTypes.STRING(500) },
    thumbnailUrl: { type: DataTypes.STRING(500) },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "videos", underscored: true, timestamps: true },
);
