'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('comments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      content: { type: Sequelize.TEXT, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "users",   // the table name, not the model name
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      video_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "videos",
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comments');
  }
};
