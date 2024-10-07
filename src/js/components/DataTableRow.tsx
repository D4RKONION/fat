import { useDispatch, useSelector } from 'react-redux';
import '../../style/components/DataTableRow.scss';
import { activeGameSelector, activePlayerSelector, advantageModifiersSelector, compactViewSelector, dataDisplaySettingsSelector, landscapeColsSelector, onBlockColoursSelector, orientationSelector, selectedCharactersSelector, themeBrightnessSelector } from '../selectors';
import { useState } from 'react';
import { setPlayerAttr } from '../actions';
import { useHistory } from 'react-router';

type Props = {
  moveName: string;
  moveData: Record<string, any>;
  colsToDisplay: Record<string, any>;
  xScrollEnabled: boolean;
  displayOnlyStateMoves: boolean
}

const DataTableRow = ({ moveName, moveData, colsToDisplay, xScrollEnabled, displayOnlyStateMoves }: Props) => {

  const currentOrientation = useSelector(orientationSelector);
  const activeGame = useSelector(activeGameSelector);
  const selectedCharacters = useSelector(selectedCharactersSelector);
  const activePlayer = useSelector(activePlayerSelector);
  const landscapeCols = useSelector(landscapeColsSelector);
  const compactView = useSelector(compactViewSelector);
  const onBlockColours = useSelector(onBlockColoursSelector);
  const counterHit = useSelector(advantageModifiersSelector).counterHitActive;
  const rawDriveRush = useSelector(advantageModifiersSelector).rawDriveRushActive;
  const vsBurntoutOpponent = useSelector(advantageModifiersSelector).vsBurntoutOpponentActive;
  const themeBrightness = useSelector(themeBrightnessSelector);
  const dataDisplaySettings = useSelector(dataDisplaySettingsSelector);

  const [advantageIndicator, setAdvantageIndicator] = useState("color")

  const dispatch = useDispatch();
  let history = useHistory();




  const parseCellData = (detailKey: string) => {

    // Game Specific rules 
    if (activeGame === "SF6") {
      if (detailKey === "onBlock" && (vsBurntoutOpponent || rawDriveRush) && !isNaN(moveData[detailKey])) {
        // generic +4 on hit raw drive rush
        return moveData[detailKey] + (vsBurntoutOpponent ? 4 : 0) + (rawDriveRush && moveData.moveType === "normal" ? 4 : 0);

      } else if (detailKey === "onHit") {
        if (moveData.afterDRoH && rawDriveRush) {
          // specified on hit raw drive rush
          return moveData.afterDRoH;

        } else if (!isNaN(moveData[detailKey]) && rawDriveRush) {
          // generic +4 on hit raw drive rush
          return moveData[detailKey] + (rawDriveRush && moveData.moveType === "normal" ? 4 : 0) + (counterHit ? 2 : 0);

        } else if (!isNaN(moveData[detailKey]) && counterHit) {
          //generic +2 on counter hit
          return moveData[detailKey] + 2;
        }
      }
    } else if (activeGame === "SFV") {
      if (counterHit && detailKey === "onHit") {
        if (moveData.ccAdv) {
          // specficied crush counter data
          return moveData.ccAdv;
        } else if (!isNaN(moveData[detailKey])) {
          // generic +2 on counter hit
          return moveData[detailKey] + 2;
        }
      }

    } else if (activeGame === "USF4" && counterHit && detailKey === "onHit" && !isNaN(moveData[detailKey])) {
      if (moveData.moveType === "normal" && moveData.moveButton.includes("L")) {
        // USF4 lights give +1 on ch
        return moveData[detailKey] + 1;
      } else {
        // otherwise it's +3
        return moveData[detailKey] + 3;
      }
    } else if (activeGame === "GGST" && counterHit && detailKey === "onHit" && moveData.chAdv) {
      // specific counterhit advantage
      return moveData.chAdv;
    }

    if (typeof moveData[detailKey] === "undefined") {
      // Fallback for blanks
      // TODO: Make this a choice between "-" and "" and "~"
      return "-"
    } else if (detailKey === "xx" && typeof moveData[detailKey] === "object") {
      // Parse cancel object with ,s
      return moveData[detailKey].map((cancelType, index) => `${cancelType}${moveData[detailKey].length - 1 !== index ? "," : ""} `);
    } else if (detailKey === "gatling" && typeof moveData[detailKey] === "object") {
      // Parse gatling object with ,s
      return moveData[detailKey].map((gatlingOption, index) => `${gatlingOption}${moveData[detailKey].length - 1 !== index ? "," : ""} `);
    } else {
      // Return the sheet data as is
      return moveData[detailKey]
    }

  }

  const addPlusToAdvantageMoves = (detailKey, cellValue) => {
    if ((detailKey.toLowerCase().includes("block") || detailKey.toLowerCase().includes("ob") || detailKey.toLowerCase().includes("hit") || detailKey.toLowerCase().includes("oh") || detailKey === "onPC" || detailKey === "onPP") && !isNaN(cellValue) && cellValue > 0) {
      return `+${cellValue}`
    } else {
      return cellValue
    }
  }
  
  const generateClassNames = (detailKey: string, cellDataToDisplay) => {
    const classNamesToAdd = []

    // Handle State shifts
    if (selectedCharacters[activePlayer].vtState !== "normal") {
      if (((moveData.changedValues && moveData.changedValues.includes(detailKey)) || moveData.uniqueInVt)
        || (detailKey === "moveName" && moveData.changedValues && (!moveData.noHL || moveData.changedValues.includes("extraInfo")))
      ) {
        classNamesToAdd.push("triggered-data");
      } else {
        //TODO allow people to stop these being greyed out as an option
        classNamesToAdd.push("untriggered-data");
      }
    } else {
      classNamesToAdd.push("normal-state");
    }

    // handle extra info borders
    if (detailKey === "moveName" && moveData.extraInfo) {
      classNamesToAdd.push("extra-info-available")
    }


    const style={

      backgroundColor: 
        activeGame === "SF6" && (vsBurntoutOpponent && (rawDriveRush && moveData.moveType === "normal")) && detailKey === "onBlock" && typeof moveData[detailKey] !== "string" && !isNaN(moveData[detailKey]) ? "var(--fat-datatable-very-plus-background"
        : activeGame === "SF6" && (vsBurntoutOpponent || (rawDriveRush && moveData.moveType === "normal")) && detailKey === "onBlock" && typeof moveData[detailKey] !== "string" && !isNaN(moveData[detailKey]) ? "var(--fat-datatable-just-plus-background"
        : activeGame === "SF6" && (rawDriveRush && moveData.moveType === "normal") && detailKey === "onHit" && typeof moveData[detailKey] !== "string" && !isNaN(moveData[detailKey]) ? "var(--fat-datatable-just-plus-background"
        : activeGame === "SF6" && rawDriveRush && detailKey === "onHit" && (moveData.afterDRoH) ? "var(--fat-datatable-just-plus-background"
        : activeGame === "GGST" && counterHit && detailKey === "onHit" && moveData.chAdv ? (themeBrightness === "light" ? "var(--fat-datatable-very-unsafe-background" : "var(--fat-datatable-very-unsafe-background")
        : activeGame === "SFV" && counterHit && detailKey === "onHit" && moveData.ccState ? (themeBrightness === "light" ? "var(--fat-datatable-very-unsafe-background" : "var(--fat-datatable-very-unsafe-background")
        : activeGame !== "3S"  && activeGame !== "GGST" && counterHit && detailKey === "onHit" && typeof moveData[detailKey] !== "string" && !isNaN(moveData[detailKey]) ? (themeBrightness === "light" ? "var(--fat-datatable-just-unsafe-background" : "var(--fat-datatable-just-unsafe-background")
        :	onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && moveData[detailKey] < -8 ? (themeBrightness === "light" ? "var(--fat-datatable-extremely-unsafe-background" : "var(--fat-datatable-extremely-unsafe-background")
        : onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && moveData[detailKey] < -5 ? (themeBrightness === "light" ? "var(--fat-datatable-very-unsafe-background" : "var(--fat-datatable-very-unsafe-background")
        // SF6 fastest moves are 4f generally, so we need to colour for < -3 instead of < -2
        : activeGame === "SF6" && onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && moveData[detailKey] < -3 ? (themeBrightness === "light" ? "var(--fat-datatable-just-unsafe-background" : "var(--fat-datatable-just-unsafe-background")
        : activeGame !== "SF6" && onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && moveData[detailKey] < -2 ? (themeBrightness === "light" ? "var(--fat-datatable-just-unsafe-background" : "var(--fat-datatable-just-unsafe-background")
        : onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && moveData[detailKey] < 1 ? (themeBrightness === "light" ? "var(--fat-datatable-safe-background" : "var(--fat-datatable-safe-background")
        : onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && (moveData[detailKey] > 2 || moveData[detailKey] === "KD") ? (themeBrightness === "light" ? "var(--fat-datatable-very-plus-background" : "var(--fat-datatable-very-plus-background")
        : onBlockColours && (detailKey.includes("Block") || detailKey.includes("OB")) && (moveData[detailKey] > 0) ? (themeBrightness === "light" ? "var(--fat-datatable-just-plus-background" : "var(--fat-datatable-just-plus-background")
        : null
    }
    
    // handle adv colors
    if (onBlockColours && (detailKey.toLowerCase().includes("block") || detailKey.toLowerCase().includes("ob") || detailKey.toLowerCase().includes("hit") || detailKey.toLowerCase().includes("oh") || detailKey === "onPC" || detailKey === "onPP")) {
      
      const amountToCheck = 
        typeof cellDataToDisplay === "string" && cellDataToDisplay.includes("(") ? cellDataToDisplay.substring(0, cellDataToDisplay.indexOf("(")) //evaluate everything before a bracket
        : cellDataToDisplay
      
      const advantageAmount = 
        amountToCheck < -8 ? "extremely-unsafe"
        : amountToCheck < -5 ? "very-unsafe"
        : (amountToCheck < -3 && activeGame === "SF6") || (amountToCheck < -2 && activeGame !== "SF6") ? "just-unsafe"
        : amountToCheck < 1 ? "safe"
        : amountToCheck < 4 ? "just-plus"
        : (amountToCheck >= 4 || (amountToCheck && amountToCheck.toLowerCase().includes("kd"))) ? "very-plus"
        : ""
        
        classNamesToAdd.push(`${advantageAmount}-${advantageIndicator}`)
      
    }
    
    return classNamesToAdd;
  }

  // If it's state moves only, we need to show the move name and not the input names
  const getMoveName = (moveName) => {
    if (displayOnlyStateMoves && dataDisplaySettings.moveNameType === "inputs") {
      return moveName.substring(moveName.indexOf("(") + 1, moveName.indexOf(")"));
    } else {
      return moveName;
    }
  }




  return (
    <tr onClick={() => {
      dispatch(setPlayerAttr(activePlayer, selectedCharacters[activePlayer].name, { selectedMove: moveName }));
      history.push(`/framedata/movedetail/${activeGame}/${selectedCharacters[activePlayer].name}/${selectedCharacters[activePlayer].vtState}/${selectedCharacters[activePlayer].frameData[moveName]["moveName"]}`)
    }} className={`DataTableRow ${xScrollEnabled ? "xScroll" : "fixed"}`}>
      <td className={`cell move-name ${generateClassNames("moveName", getMoveName(moveName)).map(className => `${className}`).join(' ')}`}>{getMoveName(moveName)}</td>
      {Object.keys(colsToDisplay).map(detailKey => {
        
        // we first parse and modify out cell data as advantage can change
        const cellDataToDisplay = addPlusToAdvantageMoves(detailKey, parseCellData(detailKey));
        return (
          <td className={`cell ${generateClassNames(detailKey, cellDataToDisplay).map(className => className).join(' ')} ${compactView && "compact"}`}
            key={`cell-entry-${detailKey}`}
          >
            {cellDataToDisplay}
          </td>
        )
      }
        
      )}
    </tr>
  )
}

export default DataTableRow;