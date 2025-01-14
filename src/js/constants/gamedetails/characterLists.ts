import ThirdStrikeDetails from "./3SGameDetails.json";
import GGSTDetails from "./GGSTGameDetails.json";
import SF6Details from "./SF6GameDetails.json";
import SFVDetails from "./SFVGameDetails.json";
import USF4Details from "./USF4GameDetails.json";

export const allCharacterLists = {
  "3S": ThirdStrikeDetails.characterList,
  USF4: USF4Details.characterList,
  SFV: SFVDetails.characterList,
  SF6: SF6Details.characterList,
  GGST: GGSTDetails.characterList,
};

export const allBookmarkStats = {
  "3S": ThirdStrikeDetails.bookmarkStats,
  USF4: USF4Details.bookmarkStats,
  SFV: SFVDetails.bookmarkStats,
  SF6: SF6Details.bookmarkStats,
  GGST: GGSTDetails.bookmarkStats,
};