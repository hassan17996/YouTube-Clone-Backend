'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('otps', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING(255), allowNull: false },
      otp: { type: Sequelize.STRING(255), allowNull: false },
      type: { type: Sequelize.STRING(30), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('otps');
  }
};
