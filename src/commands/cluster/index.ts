import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { getClustersAction } from "./get";

export function registerClusterGroup(program: Command): void {
  registerGroup(program, "cluster", [getClustersAction]);
}
