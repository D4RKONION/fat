import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage'
import persistReducer from 'redux-persist/es/persistReducer';


import { orientationReducer } from './orientation';
import { modeNameReducer } from './modename';
import { activeGameReducer } from './activegame';
import { frameDataReducer } from './framedata';
import { gameDetailsReducer } from './gamedetails';
import { activePlayerReducer } from './activeplayer';
import { selectedCharactersReducer } from './selectedcharacters';
import { modalVisibilityReducer } from './modalvisibility';
import { dataDisplaySettingsReducer } from './datadisplaysettings';
import { advantageModifiersReducer } from './advantagemodifiers';
import { appDisplaySettingsReducer } from './appdisplaysettings';
import { adviceToastReducer } from './advicetoast';
import { dataTableSettingsReducer } from './datatablesettings';
import { premiumReducer } from './premium';
import { bookmarksReducer } from './bookmarks';

const adviceToastPersistConfig = {
  key: 'adviceToast',
  storage: storage,
  blacklist: ['adviceToastShown']
}

const rootReducer = combineReducers({
  orientationState: orientationReducer,
  modeNameState: modeNameReducer,
  activeGameState: activeGameReducer,
  frameDataState: frameDataReducer,
  gameDetailsState: gameDetailsReducer,
  activePlayerState: activePlayerReducer,
  modalVisibilityState: modalVisibilityReducer,
  selectedCharactersState: selectedCharactersReducer,
  dataDisplaySettingsState: dataDisplaySettingsReducer,
  appDisplaySettingsState: appDisplaySettingsReducer,
  premiumState: premiumReducer,
  dataTableSettingsState: dataTableSettingsReducer,
  advantageModifiersState: advantageModifiersReducer,
  adviceToastState: persistReducer(adviceToastPersistConfig, adviceToastReducer),
  bookmarksState: bookmarksReducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;