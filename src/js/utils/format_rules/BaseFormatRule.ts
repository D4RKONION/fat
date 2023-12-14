export default abstract class BaseFormatRule {
    protected characterMoveRule: string;
    protected strengths: string[] = ["lp", "mp", "hp", "lk", "mk", "hk"];
    protected stanceToAbbreviationMap: Map<string, string> = new Map([
        ["stand", "st."],
        ["crouch", "cr."],
        ["jump", "j."],
        ["neutral", "nj."],
        ["close", "cl."],
        ["far", "f."],
        ["downback", "db."],
        ["back", "b."]
      ]);

    /**
     * @param rule A word, digit, or character to use as criteria for formatting
     */
    constructor(rule: string) {
        this.characterMoveRule = rule;
    }

    /**
     * Given a move in its full-length form (i.e., Stand HP), returns the
     * move in the common shorthand form of "abbreviated stance.abbreviated input",
     * i.e. st.HP
     * @param move The text representing the move as a string
     * @returns A string containing the abbreviated move
     */
    formatMove(moveData): string {
        let formattedMoveName: string = ""; 

        // If the move doesn't match the rule, we should break out of the method
        // so the next rule can take over
        if (!moveData.moveName.toLowerCase().includes(this.characterMoveRule.toLowerCase()) && this.characterMoveRule !== "") {
            return formattedMoveName;
        }

        // If the move contains something like (Hold), use the regex format method
        if (moveData.moveName.includes('(')) {
            return this.formatMoveWithParenthesis(moveData.moveName);
        }

        let stanceAbbreviation: string = this.getStanceToAbbreviation(moveData.moveName);
        let moveInput: string[] = this.extractInput(moveData);

        if (moveInput.length > 1) {
            formattedMoveName = `${stanceAbbreviation}${moveInput[0]} ${moveInput[1]}`;
        } else {
            formattedMoveName = `${stanceAbbreviation}${moveInput[0]}`;
        }

        return formattedMoveName;
    }

    /**
     * Given a stance in full form (i.e., stand), returns the abbreviated version
     * @param move The move provided to the call to formatMove
     * @returns The stance of the move in its abbreviated form
     */
    private getStanceToAbbreviation(move: string): string {
        let splitMove: string[] = move.trim().toLowerCase().split(' ');
        let stance: string = splitMove[0];

        return this.stanceToAbbreviationMap.get(stance);
    }

    /**
     * Given a move in its full-length form but with a trailing word
     * surrounded by parenthesis (i.e., Stand HP (Hold)), returns the
     * move in the common shorthand form of "abbr stance.abbr input (parenContent)"
     * i.e., st.HP (Hold)
     * @param move The move provided to the call to formatMove
     * @returns A string containing the abbreviated move
     */
    private formatMoveWithParenthesis(move: string) {
        /*
        Regex documentation:
          Lead with \s to account for the leading space, i.e, " (Hold)", but we don't want to include it in the captured result
          The outermost parentheses start the capture group of characters we DO want to capture
          The character combo of \( means that we want to find an actual opening parenthesis
          [a-z\s]* = Within the parenthesis, we want to find any combination of letters and spaces to account for cases like "(crouch large)"
          Then we want to find the closing parenthesis with \)
          The capture group is closed, and the "i" at the end sets a "case insensitive" flag for the regex expression
        */
        let splitMoveFromExtraParens: string[] = move.split(/\s(\([a-z\s]*\))/i).filter((x: string) => x !== "");
        let splitMove: string[] = splitMoveFromExtraParens[0].split(' ');
        let modifierParens: string[] = splitMoveFromExtraParens.slice(1);
        let stanceAbbreviation: string = this.stanceToAbbreviationMap.get(splitMove[0].toLowerCase());
        let input: string = splitMove[splitMove.length - 1].toUpperCase();

        return `${stanceAbbreviation}${input} ${modifierParens.join(' ')}`;
    }

    /**
     * Given a move, extract the input from it. This method's logic will vary
     * for some characters, but the default case simply retrieves the currently
     * used input from the end of the string.
     * @param move The move provided to the call to formatMove
     */
    protected abstract extractInput(moveData): string[];
}