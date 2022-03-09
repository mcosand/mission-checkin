import { Sequelize } from 'sequelize';

function build() {
  let sequelize :Sequelize;
  if (process.env.DB_HOST) {
    if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASS) {
      throw new Error('DB environment not set (DB_NAME, DB_USER, DB_PASS)');
    }
    console.log(`Using MSSQL ${process.env.DB_HOST}`);
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        dialect: 'mssql'
      }
    );
  } else {
    sequelize = new Sequelize(
      '', '', '',
      {
        dialect: 'sqlite',
        storage: 'store.sqlite'
      }
    );
  }

  return sequelize;
}


export const sequelize = build();
