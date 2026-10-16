'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('reactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: Sequelize.STRING(20), allowNull: false },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "users",
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      video_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "videos",
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
    });

    await queryInterface.addConstraint("reactions", {
      fields: ["user_id", "video_id"],
      type: "unique",
      name: "reactions_user_video_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reactions');
  }
};
