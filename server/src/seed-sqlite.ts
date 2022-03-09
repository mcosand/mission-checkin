import { sequelize } from "./db/dbBuilder";
import { HostUnitRow } from "./db/hostUnitRow";

async function run() {
  if (!process.env.DB_HOST) await sequelize.sync({force: true});

  HostUnitRow.create({ name: 'ESAR', siteDomain: 'respond2.kcesar.org', background: '#154515', color: 'white' })
  HostUnitRow.create({ name: 'SMR', siteDomain: 'respond.smr.org', background: '#00234c', color: 'white' })
}
run();