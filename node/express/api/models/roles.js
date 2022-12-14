"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Roles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Roles.init(
    {
      // 必要なものを追加
      name: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "roles",
      modelName: "Roles",
      createdAt: "created_at", // alias
      updatedAt: "updated_at",
    }
  );
  return Roles;
};
