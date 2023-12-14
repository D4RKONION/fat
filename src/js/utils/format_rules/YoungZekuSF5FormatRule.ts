import BaseFormatRule from "./BaseFormatRule";

export default class YoungZekuSF5FormatRule extends BaseFormatRule {
    constructor() {
        super("late"); 
    }
    
    protected extractInput(moveData): string[] {
        let input: string[] = [];
        let splitMove = moveData.moveName.toLowerCase().split(' ');
        let lateHit: string = `${splitMove[2]} ${splitMove[3]}`;

        input.push(splitMove[1].toUpperCase())
        input.push(lateHit);

        return input;
    }

}