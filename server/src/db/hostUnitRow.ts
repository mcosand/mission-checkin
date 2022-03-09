import { DataTypes, Model } from "sequelize";
import { sequelize } from "./dbBuilder";

export class HostUnitRow extends Model {
  declare id: number;
  declare name: string;
  declare siteDomain: string;
  declare color: string;
  declare background: string;
}

HostUnitRow.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: { type: DataTypes.STRING },
  siteDomain: { type: DataTypes.STRING },
  color: { type: DataTypes.STRING },
  background: { type: DataTypes.STRING },
}, { sequelize });