import BaseFormatRule from "./BaseFormatRule";

export default class CodyUSF4FormatRule extends BaseFormatRule {
    // Sentence-casing for the "Knife" label
    private knifeLabel: string = this.characterMoveRule.charAt(0).toUpperCase() + this.characterMoveRule.slice(1);
    
    constructor() {
        super("knife");
    }
    
    protected extractInput(moveData): string[] {
        let input: string[] = [];
        let moveInput: string = moveData.moveName.split(' ').find(x => this.strengths.some(y => y === x.toLowerCase()));

        input.push(moveInput.toUpperCase());
        input.push(this.knifeLabel);

        return input;
    }

}