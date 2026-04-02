import * as dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "dev";

let dbConfig: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

switch (nodeEnv) {
  case "prod":
    dbConfig = {
      host: process.env.DB_HOST_PROD || "localhost",
      port: parseInt(process.env.DB_PORT_PROD || "1433", 10),
      username: process.env.DB_USER_PROD || "sa",
      password: process.env.DB_PASSWORD_PROD || "",
      database: process.env.DB_NAME_PROD || "cahier_soins",
    };
    break;
  case "preprod":
    dbConfig = {
      host: process.env.DB_HOST_PREPROD || "localhost",
      port: parseInt(process.env.DB_PORT_PREPROD || "1433", 10),
      username: process.env.DB_USER_PREPROD || "sa",
      password: process.env.DB_PASSWORD_PREPROD || "",
      database: process.env.DB_NAME_PREPROD || "cahier_soins_preprod",
    };
    break;
  default:
    dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "1433", 10),
      username: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "cahier_soins_dev",
    };
}

export default new DataSource({
  type: "mssql",
  ...dbConfig,
  entities: ["src/entities/**/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  options: {
    encrypt: nodeEnv === "prod" || nodeEnv === "preprod",
    trustServerCertificate: nodeEnv !== "prod",
  },
});
