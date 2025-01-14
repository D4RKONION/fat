import { IonContent, IonPage, IonItem, IonLabel, IonIcon, IonFab, IonFabButton, IonList, IonSelect, IonSelectOption, IonListHeader, IonItemDivider, IonItemGroup, IonGrid, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonInput, IonButton } from "@ionic/react";
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import "../../../style/pages/Calculators.scss";
import "../../../style/pages/FrameKillGenerator.scss";
import "../../../style/components/FAB.scss";
import { setActiveFrameDataPlayer, setModalVisibility } from "../../actions";

import { helpSharp, person } from "ionicons/icons";

import SegmentSwitcher from "../../components/SegmentSwitcher";
import { activeGameSelector, selectedCharactersSelector } from "../../selectors";
import { GameName } from "../../types";

// We used to keep multiActive arrays in the sheets, but for consistency and ease
// it's now generated on the fly. This adds a little more computational overhead
// but it seems to be fine
const multiActiveGenerator = (move) => {
  const tempMultiActive = [];
  move.active.replaceAll("*", "(").split("(").forEach(frameChunk => {
    if (!frameChunk.includes(")")) {
      const mostRecentActiveFrame = Number(tempMultiActive.at(-1)) + 1 || Number(move.startup);
      for (let i=0; i<Number(frameChunk); i++) {
        tempMultiActive.push(mostRecentActiveFrame + i);
      }
    } else if (frameChunk.includes(")")) {
      const frameGap = Number(frameChunk.split(")")[0]);
      const activeFrames = Number(frameChunk.split(")")[1]);
      const mostRecentActiveFrame = Number(tempMultiActive.at(-1));
      for (let i = mostRecentActiveFrame + frameGap; i<mostRecentActiveFrame + frameGap + activeFrames; i++) {
        tempMultiActive.push(i +1);
      }
    }
  });

  return tempMultiActive;
};

const FrameKillGenerator = () => {
  const selectedCharacters = useSelector(selectedCharactersSelector);
  const activeGame = useSelector(activeGameSelector);

  const dispatch = useDispatch();

  const EXCLUDED_SETUP_MOVES: { [key in GameName]?: { [characterName: string]: string[] } } = {
    SF6: {
      Jamie: ["The Devil Inside (DR4 activation)"],
    },
  };

  const GAME_KNOCKDOWN_LABELS = {
    "3S": {disabled: "disabled"},
    USF4: {disabled: "disabled"},
    SFV: {kdr: "Quick", kdrb: "Back", both: "Q&B", kd: "None"},
    SF6: {onHit: "Normal Hit", onPC: "Punish Counter"},
    GGST: {disabled: "disabled"},
  };

  const [recoveryType, setRecoveryType] = useState(Object.keys(GAME_KNOCKDOWN_LABELS[activeGame])[0]);
  const [knockdownMove, setKnockdownMove] = useState(null);
  const [customKDA, setCustomKDA] = useState(0);
  const [lateByFrames, setLateByFrames] = useState(0);
  const [specificSetupMove, setSpecificSetupMove] = useState("anything");
  const [targetMeaty, setTargetMeaty] = useState(null);

  const [okiResults, setOkiResults] = useState({});

  const playerOneMoves = selectedCharacters["playerOne"].frameData;

  useEffect(() => {
    if (playerOneMoves[knockdownMove] && !(playerOneMoves[knockdownMove].kd || playerOneMoves[knockdownMove].kdr || playerOneMoves[knockdownMove].kdrb)) {
      setKnockdownMove(null);
    }
    if (!playerOneMoves[specificSetupMove] || specificSetupMove !== "Forward Dash") {
      setSpecificSetupMove("anything");
    }
    if (!playerOneMoves[targetMeaty]) {
      setTargetMeaty(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedCharacters]);

  useEffect(() => {
    setRecoveryType(Object.keys(GAME_KNOCKDOWN_LABELS[activeGame])[0]);
    setSpecificSetupMove("anything");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame]);

  useMemo(() => {
    if (typeof knockdownMove === "string" && typeof targetMeaty === "string" && (typeof playerOneMoves[knockdownMove] !== "undefined" || knockdownMove === "Custom KDA") && typeof playerOneMoves[targetMeaty] !== "undefined") {
      // https://stackoverflow.com/questions/12487422/take-a-value-1-31-and-convert-it-to-ordinal-date-w-javascript
      // This allows us to quickly create ordinal strings using active frame numbers
      const getOrdinal = (n) => {
        const s=["th","st","nd","rd"],
          v=n%100;
        return n+(s[(v-20)%10]||s[v]||s[0]);
      };

      // set up the processed data container
      let processedResults = {"Natural Setups": {}, "One Move Setups": {}, "Two Move Setups": {}, "Three Move Setups": {}};

      // Set up the number of frames the opponent is knocked down for. We add plus 1 because that is the frame the opponent is vunerable again
      let knockdownFrames;
      let coverBothKDs;
      if (knockdownMove === "Custom KDA") {
        knockdownFrames = customKDA + 1;
      } else if (recoveryType === "both") {
        knockdownFrames = playerOneMoves[knockdownMove]["kdr"] + 1;
        coverBothKDs = true;
      } else if (activeGame === "SFV") {
        knockdownFrames = playerOneMoves[knockdownMove][recoveryType] + 1;
      } else if (activeGame === "SF6") {
        knockdownFrames = Number(playerOneMoves[knockdownMove][recoveryType].match(/KD \+([^\(*,\[]+)/)?.[1]) + 1;
      }

      if (playerOneMoves[targetMeaty]["atkLvl"] === "T" ) {
        if (activeGame === "SFV") {
          knockdownFrames +=2;
        } else if (activeGame === "SF6") {
          knockdownFrames +=1;
        }
      }

      // Put the character's forward dash into the data model as a possible setup move. We will remove this at the end
      playerOneMoves["Forward Dash"] = {
        startup: 1,
        active: 0,
        recovery: parseInt(selectedCharacters.playerOne.stats.fDash as string),
      };

      if (activeGame === "SF6") {
        // Put Drive Rush into the data model as a possible setup move if the game is SF6. We will remove this at the end
        playerOneMoves["Drive Rush >"] = {
          startup: 1,
          active: 0,
          recovery: 11,
        };
      }

      // If a specific move is required in the setup, make that the only option in firstokimove
      let firstOkiMoveModel;
      if (specificSetupMove === "anything" || typeof specificSetupMove === "undefined") {
        firstOkiMoveModel = {...playerOneMoves};
      } else {
        firstOkiMoveModel = {[specificSetupMove]: playerOneMoves[specificSetupMove]};
      }

      let ordinalName;
      const moveSetLoop = (currentLateByFramesSearch, targetMeatyFrames) => {
        if (currentLateByFramesSearch === 1) {
          ordinalName = "1st (" + currentLateByFramesSearch + " frame late)";
        } else if (currentLateByFramesSearch > 1) {
          ordinalName = "1st (" + currentLateByFramesSearch + " frames late)";
        } else {
          ordinalName = getOrdinal(currentActiveFrame);
        }

        // Before we begin the loop, we check for natural meaties
        if (0 === (knockdownFrames - targetMeatyFrames + currentLateByFramesSearch)) {
          // If this is the first setup for this particular active frame, create an array for it
          if (typeof processedResults["Natural Setups"][ordinalName] === "undefined") {
            processedResults["Natural Setups"][ordinalName] = [];
          }
          processedResults["Natural Setups"][ordinalName].push(">");
        }

        // loop through the entire move set
        for (const firstOkiMove in firstOkiMoveModel) {
          // Skip any move in the explicit skip map
          if (EXCLUDED_SETUP_MOVES?.[activeGame]?.[selectedCharacters?.playerOne?.name]?.includes(firstOkiMoveModel?.[firstOkiMove]?.moveName)) {
            continue;
          }

          // Generate multiActive frames if needed
          if (typeof firstOkiMoveModel[firstOkiMove]["active"] === "string" && (firstOkiMoveModel[firstOkiMove]["active"].includes("(") || firstOkiMoveModel[firstOkiMove]["active"].includes("*")) && typeof firstOkiMoveModel[firstOkiMove]["startup"] === "number") {
            firstOkiMoveModel[firstOkiMove].multiActive = multiActiveGenerator(firstOkiMoveModel[firstOkiMove]);
          }

          // First we check if a move is a viable setup move
          if (
            (
              // It must have an explicit total value OR
              typeof firstOkiMoveModel[firstOkiMove]["total"] === "number"
              || (
                // Number values for s a (normal or multi) and r
                typeof firstOkiMoveModel[firstOkiMove]["startup"] === "number"
                && (typeof firstOkiMoveModel[firstOkiMove]["active"] === "number" || firstOkiMoveModel[firstOkiMove]["multiActive"])
                && typeof firstOkiMoveModel[firstOkiMove]["recovery"] === "number"
              )
            )
            // and it must be possible to input from neutral
            && (firstOkiMoveModel[firstOkiMove]["followUp"] !== true || typeof firstOkiMoveModel[firstOkiMove]["total"] === "number")
            && firstOkiMoveModel[firstOkiMove]["moveType"] !== "alpha"
            && firstOkiMoveModel[firstOkiMove]["moveType"] !== "super"
            && !firstOkiMoveModel[firstOkiMove]["airmove"]
          ) {
            let firstOkiMoveTotalFrames;
            // If a move has total frames, just use that
            // If a move has multiActive, we take the last element (last active frame) and add it to recovery to calculate total frames.
            // Otherwise, we just add startup active and recovery
            if (firstOkiMoveModel[firstOkiMove]["total"]) {
              firstOkiMoveTotalFrames = firstOkiMoveModel[firstOkiMove]["total"];
            } else if (firstOkiMoveModel[firstOkiMove]["multiActive"]) {
              firstOkiMoveTotalFrames = firstOkiMoveModel[firstOkiMove]["multiActive"][(firstOkiMoveModel[firstOkiMove]["multiActive"].length -1)] + firstOkiMoveModel[firstOkiMove]["recovery"];
            } else {
              firstOkiMoveTotalFrames = (firstOkiMoveModel[firstOkiMove]["startup"] -1) + firstOkiMoveModel[firstOkiMove]["active"] + firstOkiMoveModel[firstOkiMove]["recovery"];
            }

            // Then we check if the setup move would allow our target meaty to perfectly overlap with the knockdown.
            // Remember we're looping for each active frame the meaty has
            if (firstOkiMoveTotalFrames === (knockdownFrames - targetMeatyFrames + currentLateByFramesSearch)) {
              // If this is the first setup for this particular active frame, create an array for it
              if (typeof processedResults["One Move Setups"][ordinalName] === "undefined") {
                processedResults["One Move Setups"][ordinalName] = [];
              }
              processedResults["One Move Setups"][ordinalName].push(firstOkiMove);
            }

            // Pretty much the same as oki loop one
            for (const secondOkiMove in playerOneMoves) {
              // Skip any move in the explicit skip map
              if (EXCLUDED_SETUP_MOVES?.[activeGame]?.[selectedCharacters?.playerOne?.name]?.includes(playerOneMoves?.[secondOkiMove]?.moveName)) {
                continue;
              }

              // Generate multiActive frames if needed
              if (typeof playerOneMoves[secondOkiMove]["active"] === "string" && (playerOneMoves[secondOkiMove]["active"].includes("(") || playerOneMoves[secondOkiMove]["active"].includes("*")) && typeof playerOneMoves[secondOkiMove]["startup"] === "number") {
                playerOneMoves[secondOkiMove].multiActive = multiActiveGenerator(playerOneMoves[secondOkiMove]);
              }

              // First we check if a move is a viable setup move
              if (
                (
                  typeof playerOneMoves[secondOkiMove]["total"] === "number"
                  || (
                    typeof playerOneMoves[secondOkiMove]["startup"] === "number"
                    && (typeof playerOneMoves[secondOkiMove]["active"] === "number" || playerOneMoves[secondOkiMove]["multiActive"])
                    && typeof playerOneMoves[secondOkiMove]["recovery"] === "number"
                  )
                )
                && (playerOneMoves[secondOkiMove]["followUp"] !== true || typeof playerOneMoves[secondOkiMove]["total"] === "number")
                && playerOneMoves[secondOkiMove]["moveType"] !== "alpha"
                && playerOneMoves[secondOkiMove]["moveType"] !== "super"
                && !playerOneMoves[secondOkiMove]["airmove"]
                && firstOkiMove !== "Drive Rush >" // Drive Rush should only be offered as a frame kill ender, so exclude all situations where it occurs earlier in the setup
              ) {
                let secondOkiMoveTotalFrames;
                // If a move has total frames, just use that
                // If a move has multiActive, we take the last element (last active frame) and add it to recovery to calculate total frames.
                // Otherwise, we just add startup active and recovery
                if (playerOneMoves[secondOkiMove]["total"]) {
                  secondOkiMoveTotalFrames = playerOneMoves[secondOkiMove]["total"];
                } else if (playerOneMoves[secondOkiMove]["multiActive"]) {
                  secondOkiMoveTotalFrames = playerOneMoves[secondOkiMove]["multiActive"][(playerOneMoves[secondOkiMove]["multiActive"].length -1)] + playerOneMoves[secondOkiMove]["recovery"];
                } else {
                  secondOkiMoveTotalFrames = (playerOneMoves[secondOkiMove]["startup"] -1) + playerOneMoves[secondOkiMove]["active"] + playerOneMoves[secondOkiMove]["recovery"];
                }

                // Check for a successful meaty
                if ((firstOkiMoveTotalFrames + secondOkiMoveTotalFrames) === (knockdownFrames - targetMeatyFrames + currentLateByFramesSearch)) {
                  let skipDupe2 = false;
                  // here we check if we have a duplicate match. For instance, [st. lp, st.mp] would provide the same setup as [st.mp, st.lp] so we use this to ignore it
                  for (var previousSetup in processedResults["Two Move Setups"][ordinalName]) {
                    if ((processedResults["Two Move Setups"][ordinalName][previousSetup].indexOf(firstOkiMove) > -1 && processedResults["Two Move Setups"][ordinalName][previousSetup].indexOf(secondOkiMove) > -1)) {
                      if (firstOkiMove !== "Forward Dash" || secondOkiMove !== "Forward Dash") {
                        skipDupe2 = true;
                      }
                    }
                  }
                  if (!skipDupe2) {
                    if (typeof processedResults["Two Move Setups"][ordinalName] === "undefined") {
                      processedResults["Two Move Setups"][ordinalName] = [];
                    }
                    processedResults["Two Move Setups"][ordinalName].push(firstOkiMove + ", " + secondOkiMove);
                  }
                }

                // Exactly the same as loop 2
                for (const thirdOkiMove in playerOneMoves) {
                  // Skip any move in the explicit skip map
                  if (EXCLUDED_SETUP_MOVES?.[activeGame]?.[selectedCharacters?.playerOne?.name]?.includes(playerOneMoves?.[thirdOkiMove]?.moveName)) {
                    continue;
                  }
                  // Generate multiActive frames if needed
                  if (typeof playerOneMoves[thirdOkiMove]["active"] === "string" && (playerOneMoves[thirdOkiMove]["active"].includes("(") || playerOneMoves[thirdOkiMove]["active"].includes("*")) && typeof playerOneMoves[thirdOkiMove]["startup"] === "number") {
                    playerOneMoves[thirdOkiMove].multiActive = multiActiveGenerator(playerOneMoves[thirdOkiMove]);
                  }

                  // First we check if a move is a viable setup move
                  if (
                    (
                      typeof playerOneMoves[thirdOkiMove]["total"] === "number"
                      || (
                        typeof playerOneMoves[thirdOkiMove]["startup"] === "number"
                        && (typeof playerOneMoves[thirdOkiMove]["active"] === "number" || playerOneMoves[thirdOkiMove]["multiActive"])
                        && typeof playerOneMoves[thirdOkiMove]["recovery"] === "number"
                      )
                    )
                    && (playerOneMoves[thirdOkiMove]["followUp"] !== true || typeof playerOneMoves[thirdOkiMove]["total"] === "number")
                    && playerOneMoves[thirdOkiMove]["moveType"] !== "alpha"
                    && playerOneMoves[thirdOkiMove]["moveType"] !== "super"
                    && !playerOneMoves[thirdOkiMove]["airmove"]
                    && firstOkiMove !== "Drive Rush >" && secondOkiMove !== "Drive Rush >" // Drive Rush should only be offered as a frame kill ender, so exclude all situations where it occurs earlier in the setup
                  ) {
                    let thirdOkiMoveTotalFrames;
                    // If a move has total frames, just use that
                    // If a move has multiActive, we take the last element (last active frame) and add it to recovery to calculate total frames.
                    // Otherwise, we just add startup active and recovery
                    if (playerOneMoves[thirdOkiMove]["total"]) {
                      thirdOkiMoveTotalFrames = playerOneMoves[thirdOkiMove]["total"];
                    } else if (playerOneMoves[thirdOkiMove]["multiActive"]) {
                      thirdOkiMoveTotalFrames = playerOneMoves[thirdOkiMove]["multiActive"][(playerOneMoves[thirdOkiMove]["multiActive"].length -1)] + playerOneMoves[thirdOkiMove]["recovery"];
                    } else {
                      thirdOkiMoveTotalFrames = (playerOneMoves[thirdOkiMove]["startup"] -1) + playerOneMoves[thirdOkiMove]["active"] + playerOneMoves[thirdOkiMove]["recovery"];
                    }

                    // Check for a successful meaty
                    if ((firstOkiMoveTotalFrames + secondOkiMoveTotalFrames + thirdOkiMoveTotalFrames) === (knockdownFrames - targetMeatyFrames + currentLateByFramesSearch)) {
                      let skipDupe3 = false;
                      for (previousSetup in processedResults["Three Move Setups"][ordinalName]) {
                        if (processedResults["Three Move Setups"][ordinalName][previousSetup].indexOf(firstOkiMove) > -1 && processedResults["Three Move Setups"][ordinalName][previousSetup].indexOf(secondOkiMove) > -1 && processedResults["Three Move Setups"][ordinalName][previousSetup].indexOf(thirdOkiMove) > -1) {
                          if (firstOkiMove !== "Forward Dash" || secondOkiMove !== "Forward Dash"|| secondOkiMove !== "Forward Dash") {
                            skipDupe3 = true;
                          }
                        }
                      }
                      if (!skipDupe3) {
                        if (typeof processedResults["Three Move Setups"][ordinalName] === "undefined") {
                          processedResults["Three Move Setups"][ordinalName] = [];
                        }
                        processedResults["Three Move Setups"][ordinalName].push(firstOkiMove + ", " + secondOkiMove + ", " + thirdOkiMove);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const pathComparer = (kdrResults, kdrbResults) => {
        for (const obj1 in kdrResults) {
          for (const ordinal1 in kdrResults[obj1]) {
            for (const setup1 in kdrResults[obj1][ordinal1]) {
              for (const obj2 in kdrbResults) {
                for (const ordinal2 in kdrbResults[obj2]) {
                  for (const setup2 in kdrbResults[obj2][ordinal2]) {
                    if (kdrResults[obj1][ordinal1][setup1] === kdrbResults[obj2][ordinal2][setup2]) {
                      if (typeof processedResults[obj1][ordinal1 + " & " + ordinal2] === "undefined") {
                        processedResults[obj1][ordinal1 + " & " + ordinal2] = [];
                      }
                      processedResults[obj1][ordinal1 + " & " + ordinal2].push(kdrResults[obj1][ordinal1][setup1]);
                    }
                  }
                }
              }
            }
          }
        }
      };

      if (typeof playerOneMoves[targetMeaty]["active"] === "string" && (playerOneMoves[targetMeaty]["active"].includes("(") || playerOneMoves[targetMeaty]["active"].includes("*")) && typeof playerOneMoves[targetMeaty]["startup"] === "number") {
        // Generate multiActive frames
        playerOneMoves[targetMeaty].multiActive = multiActiveGenerator(playerOneMoves[targetMeaty]);
        var currentActiveFrame = 1;
        let targetMeatyFrames;

        // This first for loop is used to allow for late meaties.
        for (var currentLateByFramesSearch = 0; currentLateByFramesSearch <= lateByFrames; currentLateByFramesSearch++) {
          //First, perfect meaties are checked for
          if (currentLateByFramesSearch === 0) {
            // Begin the for loop. We loop through once for each active frame the targe meaty has)
            for (var frame in playerOneMoves[targetMeaty]["multiActive"]) {
              // multiActive is a direct array of when each active frame occurs. No need for any extra calculation
              targetMeatyFrames = playerOneMoves[targetMeaty]["multiActive"][frame];
              moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
              currentActiveFrame++;
            }
          } else {
            // Then we do a late meaty search. Late meaties are only ever going to happen on the first active frame, so
            //we don't need to loop this time
            currentActiveFrame = 1;
            targetMeatyFrames = parseInt(playerOneMoves[targetMeaty]["startup"] as unknown as string);
            moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
          }
        }

        if (coverBothKDs) {
          currentActiveFrame = 1;

          const kdrResults = {...processedResults};
          processedResults = {"Natural Setups": {}, "One Move Setups": {}, "Two Move Setups": {}, "Three Move Setups": {}};

          knockdownFrames = playerOneMoves[knockdownMove]["kdrb"] + 1;
          if (playerOneMoves[targetMeaty]["atkLvl"] === "T" ) {
            knockdownFrames +=2;
          }

          // This first for loop is used to allow for late meaties.
          for (currentLateByFramesSearch = 0; currentLateByFramesSearch <= lateByFrames; currentLateByFramesSearch++) {
            //First, perfect meaties are checked for
            if (currentLateByFramesSearch === 0) {
              // Begin the for loop. We loop through once for each active frame the targe meaty has)
              for (frame in playerOneMoves[targetMeaty]["multiActive"]) {
                // multiActive is a direct array of when each active frame occurs. No need for any extra calculation
                targetMeatyFrames = playerOneMoves[targetMeaty]["multiActive"][frame];

                moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);

                currentActiveFrame++;
              }
            } else {
              // Then we do a late meaty search. Late meaties are only ever going to happen on the first active frame, so
              //we don't need to loop this time
              currentActiveFrame = 1;
              targetMeatyFrames = parseInt(playerOneMoves[targetMeaty]["startup"] as unknown as string);
              moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
            }
          }
          var kdrbResults = {...processedResults};
          processedResults = {"Natural Setups": {}, "One Move Setups": {}, "Two Move Setups": {}, "Three Move Setups": {}};

          pathComparer(kdrResults, kdrbResults);
        }
      } else {
        // This first for loop is used to allow for late meaties.
        for (currentLateByFramesSearch = 0; currentLateByFramesSearch <= lateByFrames; currentLateByFramesSearch++) {
          //First, perfect meaties are checked for
          if (currentLateByFramesSearch === 0) {
            // Begin the for loop. We loop through once for each active frame the targe meaty has)
            for (currentActiveFrame = 1; currentActiveFrame <= playerOneMoves[targetMeaty]["active"]; currentActiveFrame++) {
              // We minus one because last frame of startup and first active frame are the same frame
              var targetMeatyFrames = (parseInt(playerOneMoves[targetMeaty]["startup"]) -1) + currentActiveFrame;

              moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
            }
          } else {
            // Then we do a late meaty search. Late meaties are only ever going to happen on the first active frame, so
            //we don't need to loop this time
            currentActiveFrame = 1;
            targetMeatyFrames = parseInt(playerOneMoves[targetMeaty]["startup"]);
            moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
          }
        }

        if (coverBothKDs) {
          const kdrResults = {...processedResults};
          processedResults = {"Natural Setups": {}, "One Move Setups": {}, "Two Move Setups": {}, "Three Move Setups": {}};
          knockdownFrames = playerOneMoves[knockdownMove]["kdrb"] + 1;
          if (playerOneMoves[targetMeaty]["atkLvl"] === "T" ) {
            knockdownFrames +=2;
          }

          // This first for loop is used to allow for late meaties.
          for (currentLateByFramesSearch = 0; currentLateByFramesSearch <= lateByFrames; currentLateByFramesSearch++) {
            //First, perfect meaties are checked for
            if (currentLateByFramesSearch === 0) {
              // Begin the for loop. We loop through once for each active frame the targe meaty has)
              for (currentActiveFrame = 1; currentActiveFrame <= playerOneMoves[targetMeaty]["active"]; currentActiveFrame++) {
                // We minus one because last frame of startup and first active frame are the same frame
                targetMeatyFrames = (parseInt(playerOneMoves[targetMeaty]["startup"]) -1) + currentActiveFrame;

                moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
              }
            } else {
              // Then we do a late meaty search. Late meaties are only ever going to happen on the first active frame, so
              //we don't need to loop this time
              currentActiveFrame = 1;
              targetMeatyFrames = parseInt(playerOneMoves[targetMeaty]["startup"]);
              moveSetLoop(currentLateByFramesSearch, targetMeatyFrames);
            }
          }
          kdrbResults = {...processedResults};
          processedResults = {"Natural Setups": {}, "One Move Setups": {}, "Two Move Setups": {}, "Three Move Setups": {}};
          pathComparer(kdrResults, kdrbResults);
        }
      }

      // Remove any empty objects
      for (const obj in processedResults) {
        if (Object.keys(processedResults[obj]).length === 0 && processedResults[obj].constructor === Object) {
          delete processedResults[obj];
        }
      }

      // Remove the character's forward dash from the move model, so it doesn't show up elsewhere
      delete playerOneMoves["Forward Dash"];
      if (activeGame === "SF6") {
        delete playerOneMoves["Drive Rush >"];
      }
      
      if (Object.keys(processedResults).length !== 0) {
        setOkiResults(processedResults);
      } else {
        setOkiResults(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[recoveryType, knockdownMove, lateByFrames, specificSetupMove, targetMeaty, playerOneMoves, selectedCharacters.playerOne.stats.fDash, customKDA]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/calculators" />
          </IonButtons>
          <IonTitle>{`Oki - ${selectedCharacters.playerOne.name}`}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => { dispatch(setModalVisibility({ currentModal: "help", visible: true }));}}><IonIcon slot="icon-only" icon={helpSharp} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent id="FrameKillGenerator" className="calculators">
        {Object.keys(GAME_KNOCKDOWN_LABELS[activeGame])[0] === "disabled" ? (
        
          <IonGrid fixed>
            <div>
              <h4>Sorry, this calculator doesn't work with {activeGame}</h4>
            </div>
          </IonGrid>
        ) :(
          <>
        
            <IonGrid fixed>
              <SegmentSwitcher
                key={"Oki KD type"}
                valueToTrack={recoveryType}
                segmentType={"recovery-type"}
                labels={ GAME_KNOCKDOWN_LABELS[activeGame] }
                clickFunc={ (eventValue) => recoveryType !== eventValue &&
              setRecoveryType(eventValue)}
              />

              <IonItem lines="full">
                <IonSelect
                  label={"Knock down with"}
                  interface="modal"
                  interfaceOptions={{ header: "Knock down with" }}
                  value={knockdownMove}
                  okText="Select"
                  cancelText="Cancel"
                  onIonChange={e => setKnockdownMove(e.detail.value)}
                >
                  <IonSelectOption value={null}>Select a move</IonSelectOption>
                  <IonSelectOption value={"Custom KDA"}>Custom KDA</IonSelectOption>
                  {Object.keys(playerOneMoves).filter(move =>
                    activeGame === "SFV" ?
                      playerOneMoves[move].kd || playerOneMoves[move].kdr || playerOneMoves[move].kdrb
                      : activeGame === "SF6" ?
                        playerOneMoves[move][recoveryType] && isNaN(playerOneMoves[move][recoveryType]) && !isNaN(Number(playerOneMoves[move][recoveryType].match(/KD \+([^\(*,\[]+)/)?.[1]) + 1)
                        : null
                  ).map(move =>
                    <IonSelectOption key={`knockdownMove-${move}`} value={move}>{move}</IonSelectOption>
                  )
                  }
                </IonSelect>
              </IonItem>
          
              {knockdownMove === "Custom KDA" &&
            <IonItem lines="full">
              <IonLabel position="fixed">Custom KDA</IonLabel>
              <IonInput style={{textAlign: "end"}} slot="end" type="number" value={customKDA} placeholder="Enter Number" onIonInput={e => setCustomKDA(!!parseInt(e.detail.value) && parseInt(e.detail.value))}></IonInput>
            </IonItem>
              }
          
              <IonItem lines="full">
                <IonLabel style={{flex: "1 0 auto"}} slot="start">Include Late Meaties</IonLabel>
                <IonInput style={{textAlign: "end"}} slot="end" type="number" value={lateByFrames} placeholder="Enter Number" onIonInput={e => setLateByFrames(!!parseInt(e.detail.value) ? parseInt(e.detail.value) : 0)}></IonInput>
                <IonLabel slot="end">Frames</IonLabel>
              </IonItem>

              <IonItem lines="full">
                <IonSelect
                  label="Setup contains"
                  interface="modal"
                  interfaceOptions={{ header: "Setup Contains" }}
                  value={specificSetupMove}
                  okText="Select"
                  cancelText="Cancel"
                  onIonChange={e => setSpecificSetupMove(e.detail.value)}
                >
                  <IonSelectOption value={"anything"}>Anything</IonSelectOption>
                  <IonSelectOption value={"Forward Dash"}>Forward Dash</IonSelectOption>
                  {activeGame === "SF6" &&
                <IonSelectOption value={"Drive Rush >"}>{"Drive Rush >"}</IonSelectOption>
                  }
                  {Object.keys(playerOneMoves).filter(move =>
                    (
                      (typeof playerOneMoves[move].startup === "number" &&
                  typeof playerOneMoves[move].active === "number") ||
                  typeof playerOneMoves[move].multiActive
                    ) &&
                typeof playerOneMoves[move].recovery === "number" &&
                !playerOneMoves[move].followUp &&
                playerOneMoves[move].moveType !== "alpha" &&
                playerOneMoves[move].moveType !== "super" &&
                !playerOneMoves[move].airmove
                  ).map(move =>
                    <IonSelectOption key={`specificSetup-${move}`} value={move}>{move}</IonSelectOption>
                  )}
                </IonSelect>
              </IonItem>

              <IonItem lines="full">
                <IonSelect
                  label="Target meaty"
                  interface="modal"
                  interfaceOptions={{ header: "Target Meaty" }}
                  value={targetMeaty}
                  okText="Select"
                  cancelText="Cancel"
                  onIonChange={e => setTargetMeaty(e.detail.value)}
                >
                  <IonSelectOption key="targetMeaty-select" value={null}>Select a move</IonSelectOption>
                  {Object.keys(playerOneMoves).filter(move =>
                    !playerOneMoves[move].airmove &&
                    !playerOneMoves[move].followUp &&
                    !playerOneMoves[move].nonHittingMove &&
                    playerOneMoves[move].moveType !== "alpha"
                  ).map(move =>
                    <IonSelectOption key={`targetMeaty-${move}`} value={move}>{move}</IonSelectOption>
                  )}
                </IonSelect>
              </IonItem>

              {(playerOneMoves[knockdownMove] || knockdownMove === "Custom KDA") && playerOneMoves[targetMeaty] &&
            <IonItem lines="full" className="selected-move-info">
              <IonLabel>
                <h3>Knockdown with</h3>
                <h2>{knockdownMove}</h2>
                <>
                  {recoveryType === "both"
                    ? <>
                      <p>KD Advantage (Q): <strong>{knockdownMove === "Custom KDA" ? customKDA : playerOneMoves[knockdownMove]["kdr"]}</strong></p>
                      <p>KD Advantage (B): <strong>{knockdownMove === "Custom KDA" ? customKDA : playerOneMoves[knockdownMove]["kdrb"]}</strong></p>
                    </>
                    : <p>KD Advantage: <strong>{knockdownMove === "Custom KDA" ? customKDA : playerOneMoves[knockdownMove][recoveryType] || playerOneMoves[knockdownMove].onHit.split("KD +").at(-1)}</strong></p>
                  }
                </>

              </IonLabel>
              <IonLabel>
                <h3>Target Meaty</h3>
                <h2>{targetMeaty}</h2>
                <p>Startup: <b>{playerOneMoves[targetMeaty].startup}</b></p>
                <p>Active: <b>{playerOneMoves[targetMeaty].active}</b></p>
              </IonLabel>
            </IonItem>
              }

              <IonList>
                {okiResults
                  ? Object.keys(okiResults).map(numOfMovesSetup =>
                    <IonItemGroup key={numOfMovesSetup}>
                      <IonItemDivider><p>{numOfMovesSetup}</p></IonItemDivider>
                      {Object.keys(okiResults[numOfMovesSetup]).map(activeAsOrdinal =>
                        <div key={activeAsOrdinal}>
                          <IonListHeader className="ordinal-header">
                            <IonLabel>
                              <p>Meaty on the <strong>{activeAsOrdinal}</strong> active frame{recoveryType === "both" && "s"}</p>
                            </IonLabel>
                          </IonListHeader>
                          {Object.keys(okiResults[numOfMovesSetup][activeAsOrdinal]).map((setup, index) =>
                            <IonItem key={activeAsOrdinal + index}>
                              <IonLabel>
                                <p>{knockdownMove}, <strong style={{marginLeft: "3px"}}>[{okiResults[numOfMovesSetup][activeAsOrdinal][setup]}]</strong>, {targetMeaty}</p>
                              </IonLabel>
                            </IonItem>
                          )}
                        </div>
                      )}
                    </IonItemGroup>
                  )
                  : <h4>No oki found for this setup...<br/>Sorry!</h4>
                }
              </IonList>

            </IonGrid>

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={() => {dispatch(setActiveFrameDataPlayer("playerOne")); dispatch(setModalVisibility({ currentModal: "characterSelect", visible: true})); } }>
                <IonIcon icon={person} />
              </IonFabButton>
            </IonFab>
          </>

        )}

      </IonContent>
      
    </IonPage>
  );
};

export default FrameKillGenerator;
