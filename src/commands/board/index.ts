import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listBoardAction } from "./list";
import { createBoardAction } from "./create";
import { showBoardAction } from "./show";
import { updateBoardAction } from "./update";
import { moveBoardAction } from "./move";
import { commentBoardAction } from "./comment";
import { deleteBoardAction } from "./delete";

export function registerBoardGroup(program: Command): void {
  registerGroup(program, "board", [
    listBoardAction,
    createBoardAction,
    showBoardAction,
    updateBoardAction,
    moveBoardAction,
    commentBoardAction,
    deleteBoardAction,
  ]);
}
