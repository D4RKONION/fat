import BaseFormatRule from "./baseformatrule";

export default class MenatSF5FormatRule extends BaseFormatRule { 
    // Sentence-casing for the "Orb" label
    private orbLabel = this.characterMoveRule.charAt(0).toUpperCase() + this.characterMoveRule.slice(1);
    
    constructor() {
        super("orb");
    }

    protected extractInput(moveData): string[] {
        let input: string[] = [];
        let moveInput: string = moveData.moveName.split(' ').find(x => this.strengths.some(y => y === x.toLowerCase()));

        input.push(moveInput.toUpperCase());
        input.push(this.orbLabel);

        return input;
    }
}