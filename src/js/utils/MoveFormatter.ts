import BaseFormatRule from "./format_rules/BaseFormatRule";
import CodyUSF4FormatRule from "./format_rules/CodyUsf4FormatRule";
import DefaultFormatRule from "./format_rules/DefaultFormatRule";
import MenatSF5FormatRule from "./format_rules/MenatSf5FormatRule";
import YoungZekuSF5FormatRule from "./format_rules/YoungZekuSf5FormatRule";

export default class MoveFormatter {
    private rules: BaseFormatRule[];

    constructor() {
        this.rules = [
            new MenatSF5FormatRule(),
            new YoungZekuSF5FormatRule(),
            new CodyUSF4FormatRule(),
            new DefaultFormatRule()
        ];
    }

    formatToShorthand(moveData): string {
        let shorthand: string;

        for (const rule of this.rules) {
            if (this.skipFormattingMove(moveData)) {
                return "";
            }

            shorthand = rule.formatMove(moveData);

            if (shorthand) {
                return shorthand;
            }
        }

        return "";
    }

    /**
     * Skips character moves that meet various criteria in order to focus on applying
     * formatting to normals. 
     * @remarks Some move types like command normals and others will sometimes get caught by the
     * formatter engine because of their attributes in their JSON object.
     * @param moveData The current move and its attributes as a JSON object
     * @returns true if the move should not have formatting applied to it, false otherwise
     */
    private skipFormattingMove(moveData): boolean {
        const TARGET_COMBO: string[] = ["(TC)", "Target Combo"];
        const COMMAND_NORMAL: string[] = ["3", "6"];
        const SYMBOLIC_CMD_NORMAL: string[] = [">", "(air)", "(run)", "(lvl"];
        const RASHID_WIND: string = "(wind)";
        const IGNORED_THIRD_STRIKE_MOVES: string[] = [
          "Kakushuu Rakukyaku" /* Chun-li b.MK (Hold) */,
          "Inazuma Kakato Wari (Long)" /* Ken b.MK (Hold) */,
          "Elbow Cannon" /* Necro db.HP */
        ];
        const MOVE_NAME: string = moveData.moveName;
        
        if (!moveData.numCmd) {
          if (!moveData.plnCmd) {
            return true;
          }
        }

        // Do not attempt to apply formatting to target combos
        if (TARGET_COMBO.some(indicator => MOVE_NAME.includes(indicator))) {
          return true;
        }
    
        // Do not attempt to apply formatting to command normals
        if (COMMAND_NORMAL.some(indicator => moveData.numCmd.includes(indicator))) {
            return true;
        }
    
        // If the above check doesn't find anything, check for some other common indicators; if
        // nothing comes back here, we're good and don't need to skip formatting
        if (SYMBOLIC_CMD_NORMAL.some(indicator => moveData.plnCmd.includes(indicator))) {
          return true;
        }
    
        // Rashid should be the only one (for now) to trigger this condition for his mixers
        if (MOVE_NAME.includes(RASHID_WIND)) {
          return true;
        }

        // For USF4, if the move motion is "back" but the move name doesn't include back, skip it
        if (moveData.moveMotion === "B" && !MOVE_NAME.includes("Back")) {
          return true;
        }

        // There are three awkward moves that get caught by the formatting engine
        // for the 3S data. If the 3S data is ever cleaned up, this could be removed
        // or refactored
        if (IGNORED_THIRD_STRIKE_MOVES.some(indicator => MOVE_NAME === indicator)) {
          return true;
        }
    
        return false;       
    }
}