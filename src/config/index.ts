import { readFileSync } from "fs";

export default JSON.parse(readFileSync("config.json", "utf-8"))