'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('videos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },
      video_url: { type: Sequelize.STRING(500) },
      thumbnail_url: { type: Sequelize.STRING(500) },
      views: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "users",   // the table name, not the model name
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('videos');
  }
};
