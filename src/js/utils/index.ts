import { mapKeys, isEqual } from 'lodash';
import { DataDisplaySettingsReducerState } from '../reducers/datadisplaysettings';
import { VtState } from '../types';

/**
 * Renames the moves in the character frame data to reflect the user's desired naming convention
 * @param {string} rawFrameData The frame data for the current character
 * @param {DataDisplaySettingsReducerState} dataDisplayState The Redux state containing various move text render settings
 * @returns The frame data JSON object with renamed moves
 */
export function renameData(rawFrameData, dataDisplayState: DataDisplaySettingsReducerState) {
  const renameFrameData = (rawData, renameKey, notationDisplay) => {
    switch (notationDisplay) {
      case "fullWord":
        return mapKeys(rawData, (moveValue, moveKey) => moveValue[renameKey] ? moveValue[renameKey] : moveKey);
      case "shorthand":
        return renameFrameDataToShorthand(rawData, renameKey);
      default:
        break;
    }
  }

  const renameFrameDataToShorthand = (rawData: string, nameTypeKey: string) => {
    let rename = mapKeys(rawData, (moveValue, moveKey) => {
      if ((moveValue.moveType === "normal" || moveValue.moveType === "held normal") && !moveValue.movesList) {
        return formatMoveName(moveValue);
      } else {
        return moveValue[nameTypeKey];
      }
    });

    return rename;
  }

  const skipFormattingMove = (moveData) => {
    const TARGET_COMBO: string = "(TC)";
    const COMMAND_NORMAL: string[] = ["b", "f", ">", "(air)"];
    const MOVE_NAME: string = moveData.moveName;
    
    if (MOVE_NAME.includes(TARGET_COMBO)) {
      return true;
    }

    // Other languages have a cleaner way of representing this: if any of the values in the
    // array are in the string, just return the move name since it's a command normal
    if (COMMAND_NORMAL.some(indicator => moveData.plnCmd.includes(indicator))) {
      return true;
    }

    return false;
  }

  const formatMoveName = (moveData) => {
    let truncatedMoveName: string = "";
    const wordToAbbreviationMap: Map<string, string> = new Map([
      ["stand", "st."],
      ["crouch", "cr."],
      ["jump", "j."],
      ["neutral", "nj."]
    ]);

    if (!skipFormattingMove(moveData)) {
      if (!moveData.moveName.includes('(')) {
        let splitMoveName: string[] = moveData.moveName.toLowerCase().split(' ');
        let abbr: string = wordToAbbreviationMap.get(splitMoveName[0]);
        let input: string = splitMoveName[splitMoveName.length - 1].toUpperCase();
        truncatedMoveName = `${abbr}${input}`;
      } else {
        /*
        Regex documentation:
          Lead with \s to account for the leading space, i.e, " (Hold)", but we don't want to include it in the captured result
          The outermost parentheses start the capture group of characters we DO want to capture
          The character combo of \( means that we want to find an actual opening parenthesis
          [a-z\s]* = Within the parenthesis, we want to find any combination of letters and spaces to account for cases like "(crouch large)"
          Then we want to find the closing parenthesis with \)
          The capture group is closed, and the "i" at the end sets a "case insensitive" flag for the regex expression
        */
        let splitMoveFromExtraParens: string[] = moveData.moveName.split(/\s(\([a-z\s]*\))/i).filter((x: string) => x !== "");
        let splitMove: string[] = splitMoveFromExtraParens[0].split(' ');
        let modifierParens: string[] = splitMoveFromExtraParens.slice(1);
        let abbr: string = wordToAbbreviationMap.get(splitMove[0].toLowerCase());
        let input: string = splitMove[splitMove.length - 1].toUpperCase();
        truncatedMoveName = `${abbr}${input} ${modifierParens.join(' ')}`;
      }
    } 
    
    return truncatedMoveName;
  }

  switch (dataDisplayState.moveNameType) {
    case "official":
      return renameFrameData(rawFrameData, "moveName", dataDisplayState.normalNotationType);
    case "common":
      return renameFrameData(rawFrameData, "cmnName", dataDisplayState.normalNotationType);
    case "inputs":
      return renameFrameData(rawFrameData, dataDisplayState.inputNotationType, "fullWord");
    default:
      return rawFrameData;
  }
}


// Each move in the displayed frame data object needs to have an array that keeps track of any values
// which change when the character activates V-Trigger
function vTriggerMerge(rawFrameData, vtState) {

  const vtMergedData = {
    ...rawFrameData.normal, ...rawFrameData[vtState]
  }

  Object.keys(rawFrameData[vtState]).forEach(vtMove => {
    let changedValues = [];
    Object.keys(rawFrameData[vtState][vtMove]).forEach(detail => {
      if (!rawFrameData.normal[vtMove]) {
        vtMergedData[vtMove]["uniqueInVt"] = true;
      } else if (rawFrameData.normal[vtMove] && !isEqual(rawFrameData.normal[vtMove][detail], rawFrameData[vtState][vtMove][detail])) {
        changedValues = [...changedValues, detail]
      }
    })
    vtMergedData[vtMove] = { ...vtMergedData[vtMove], changedValues }
  }
  )

  // based on https://stackoverflow.com/a/39442287
  return (
    Object.entries(vtMergedData)
      .sort((moveOne: any, moveTwo: any) => {
        return moveOne[1].i - moveTwo[1].i
      })
      .reduce((_sortedObj, [k, v]) => ({
        ..._sortedObj,
        [k]: v
      }), {})
  )


}

// this allow me to build the JSON for the setPlayer action creator in selectCharacter, SegmentSwitcher and ____ componenet
export function helpCreateFrameDataJSON(rawFrameData, dataDisplayState: DataDisplaySettingsReducerState, vtState: VtState) {

  const dataToRename = (vtState === "normal") ? rawFrameData.normal : vTriggerMerge(rawFrameData, vtState);

  return renameData(dataToRename, dataDisplayState);
}