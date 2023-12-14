import { mapKeys, isEqual } from 'lodash';
import { DataDisplaySettingsReducerState } from '../reducers/datadisplaysettings';
import { VtState } from '../types';
import MoveFormatter from './MoveFormatter';

/**
 * Renames the moves in the character frame data to reflect the user's desired naming convention
 * @param {string} rawFrameData The frame data for the current character
 * @param {DataDisplaySettingsReducerState} dataDisplayState The Redux state containing various move text render settings
 * @returns The frame data JSON object with renamed moves
 */
export function renameData(rawFrameData, dataDisplayState: DataDisplaySettingsReducerState, activeGame: string) {
  const renameFrameData = (rawData, renameKey, notationDisplay) => {
    switch (notationDisplay) {
      case "fullWord":
        return mapKeys(rawData, (moveValue, moveKey) => moveValue[renameKey] ? moveValue[renameKey] : moveKey);
      case "shorthand":
        return renameFrameDataToShorthand(rawData, renameKey, activeGame);
      default:
        break;
    }
  }

  const renameFrameDataToShorthand = (rawData: string, nameTypeKey: string, activeGame: string) => {
    const MOVE_TYPE_HELD_NORMAL: string = "held normal"; 
    const MOVE_TYPE_NORMAL: string = "normal";
    const GUILTY_GEAR_STRIVE: string = "ggst";

    let rename = mapKeys(rawData, (moveValue, moveKey) => {
      let activeGameIsGuiltyGearStrive: boolean = activeGame.toLowerCase() === GUILTY_GEAR_STRIVE;
      let defaultMoveName: string = moveValue[nameTypeKey] ? moveValue[nameTypeKey] : moveKey;
      let moveDataHasMovesList: boolean = Boolean(moveValue.movesList);

      // Conditional expressions are used here because checking moveValue.moveType for a truthy value
      // is how JavaScript/TypeScript can simultaneously check if a string is empty, null, or undefined
      let moveIsNormal: boolean = moveValue.moveType ? moveValue.moveType.toLowerCase() === MOVE_TYPE_NORMAL : false; 
      let moveIsHeldNormal: boolean = moveValue.moveType ? moveValue.moveType.toLowerCase() === MOVE_TYPE_HELD_NORMAL : false;

      if (activeGameIsGuiltyGearStrive) {
        return defaultMoveName;
      }

      if (moveIsNormal) {
        if (moveDataHasMovesList) {
          return moveIsHeldNormal ? formatMoveName(moveValue) : defaultMoveName;
        } else {
          let formattedMove: string = formatMoveName(moveValue);
          return formattedMove !== "" ? formattedMove : defaultMoveName;
        }
      } else {
        return defaultMoveName;
      }
    });

    return rename;
  }

  const formatMoveName = (moveData) => {   
    let truncatedMoveName: string = "";
    let moveFormatter = new MoveFormatter();

    truncatedMoveName = moveFormatter.formatToShorthand(moveData);
        
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
export function helpCreateFrameDataJSON(rawFrameData, dataDisplayState: DataDisplaySettingsReducerState, vtState: VtState, activeGame: string) {

  const dataToRename = (vtState === "normal") ? rawFrameData.normal : vTriggerMerge(rawFrameData, vtState);

  return renameData(dataToRename, dataDisplayState, activeGame);
}