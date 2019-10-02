import config from "config";
import chalk from "chalk";

export function LOG(val: any) {
  console.log(val);
}

export function SUCCESS(val: any) {
  console.log(chalk.bgGreen.black(val));
}

export function WARN(val: any) {
  console.warn(chalk.bgYellow.black(val));
}

export function ERROR(val: any) {
  console.error(chalk.bgRed(val));
}