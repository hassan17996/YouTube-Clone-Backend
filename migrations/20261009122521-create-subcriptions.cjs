'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('subscriptions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      subscriber_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "users",
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      channel_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: "users",
          key: "id"
        }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addConstraint("subscriptions", {
      fields: ["subscriber_id", "channel_id"],
      type: "unique",
      name: "subscriptions_subscriber_channel_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};
