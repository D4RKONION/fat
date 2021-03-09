import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonAlert, isPlatform, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { peopleOutline, settingsOutline, settingsSharp, moon, sunny, gameControllerOutline, gameControllerSharp, libraryOutline, librarySharp, calculatorOutline, calculatorSharp, caretDownOutline, searchOutline, searchSharp, statsChartOutline, statsChartSharp, barbellOutline, barbellSharp, colorPaletteOutline, colorPaletteSharp, menuSharp, logoPaypal, phonePortraitOutline, phonePortraitSharp } from 'ionicons/icons';

import React, { useEffect, useState } from 'react';
import { withRouter, useLocation } from 'react-router-dom';
import { connect } from 'react-redux'

import '../../style/components/Menu.scss';
import { setModalVisibility, setModeName, setActiveGame } from '../actions'
import CharacterSelectModal from './CharacterSelect';
import WhatsNewModal from './WhatsNew'
import HelpModal from './Help';
import framesIcon from  '../../images/icons/frames.svg';
import patreonIcon from '../../images/icons/patreon.svg';
import { APP_CURRENT_VERSION_NAME } from '../constants/VersionLogs';
import BrightnessToggle from './BrightnessToggle';

const Menu = ({ themeBrightness, themeBrightnessClickHandler, selectedCharacters, setModalVisibility, modeName, setModeName, activeGame, setActiveGame }) => {

  const [activeGameAlertOpen, setActiveGameAlertOpen] = useState(false);
  const [isWideFullMenuOpen, setIsWideFullMenuOpen] = useState(false) 
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname.includes("calculators") && location.pathname.split("/").length > 2) {
      setModeName(`calc-${location.pathname.split("/")[2]}`);
    } else if (location.pathname.includes("movedetail")) {
      setModeName("movedetail")
    } else if (
      location.pathname.includes("stats")
      || (location.pathname.includes("settings") && location.pathname.split("/").length > 2)
      || (location.pathname.includes("moreresources") && location.pathname.split("/").length > 2)
      || (location.pathname.includes("themestore") && location.pathname.split("/").length > 2)
    ) {
      setModeName("subpage");
    } else {
      setModeName(location.pathname.split("/")[1]);
    }
  },[location.pathname, setModeName]);

  //account for the fact this will be imported some day
  //perhaps do a check in the div creation and concat the selected character in
  const appPages = [
    {
      title: 'Frame Data',
      url: `/framedata/${activeGame}/${selectedCharacters.playerOne.name}`,
      iosIcon: framesIcon,
      mdIcon: framesIcon,
      modeName: "framedata"
    },
    {
      title: 'Yaksha Search',
      url: `/yaksha`,
      iosIcon: searchOutline,
      mdIcon: searchSharp,
      modeName: "yaksha"
    },
    {
      title: 'Moves List',
      url: `/moveslist/${activeGame}/${selectedCharacters.playerOne.name}`,
      iosIcon: gameControllerOutline,
      mdIcon: gameControllerSharp,
      modeName: "moveslist"
    },
    {
      title: 'Combos & Tech',
      url: `/combos/${activeGame}/${selectedCharacters.playerOne.name}`,
      iosIcon: barbellOutline,
      mdIcon: barbellSharp,
      modeName: "combos"
    },
    {
      title: 'Stat Compare',
      url: `/statcompare`,
      iosIcon: statsChartOutline,
      mdIcon: statsChartSharp,
      modeName: "statcompare"
    },
    {
      title: 'Calculators',
      url: `/calculators`,
      iosIcon: calculatorOutline,
      mdIcon: calculatorSharp,
      modeName: "calculators"
    },
    {
      title: 'More Resources',
      url: `/moreresources`,
      iosIcon: libraryOutline,
      mdIcon: librarySharp,
      modeName: "moreresources"
    },
    {
      title: 'Settings',
      url: '/settings',
      iosIcon: settingsOutline,
      mdIcon: settingsSharp,
      modeName: "settings"
    },
    {
      title: 'Theme Store',
      url: '/themestore',
      iosIcon: colorPaletteOutline,
      mdIcon: colorPaletteSharp,
      modeName: "themestore",
      appOnly: true,
    },
    {
      title: 'Get the app!',
      url: '#',
      externalUrl: "https://fullmeter.com/fat",
      iosIcon: phonePortraitOutline,
      mdIcon: phonePortraitSharp,
      modeName: "app",
      desktopOnly: true,
    },
    {
      title: 'Support on Patreon',
      externalUrl: "https://www.patreon.com/d4rk_onion",
      url: '#',
      iosIcon: patreonIcon,
      mdIcon: patreonIcon,
      modeName: null,
      desktopOnly: true,
    },
    {
      title: 'Support on Paypal',
      url: '#',
      externalUrl: "https://paypal.me/fullmeter",
      iosIcon: logoPaypal,
      mdIcon: logoPaypal,
      modeName: null,
      desktopOnly: true,
    },
  ];
  
  const LS_FRAME_DATA_CODE = localStorage.getItem("lsFrameDataCode");
  console.log(isPlatform("desktop"))

  return (
    <IonMenu
      id="sideMenu"
      menuId="sideMenu"
      contentId="main"
      type="overlay"
      className={isWideFullMenuOpen ? "wide-full-menu" : "wide-partial-menu"}
    >
      <IonContent>
        <div id="mobileSideMenu">
          <div id="menuHeader">
            <div id="themeButton" onClick={(() => themeBrightnessClickHandler())}>
              <IonIcon icon={themeBrightness === "dark" ? sunny : moon} />
            </div>
            <div id="appDetails">
              <h2>FAT - <span onClick={() => modeName !== "movedetail" && setActiveGameAlertOpen(true)}>{activeGame} <IonIcon icon={caretDownOutline} /></span></h2>
              <p>Ver {`${APP_CURRENT_VERSION_NAME}.${LS_FRAME_DATA_CODE}`}</p>
            </div>
          </div>
          <IonList id="pageList">
            <IonMenuToggle autoHide={false}>
              <IonItem disabled={modeName === "movedetail"} key="mobile-charSelectItem" onClick={() => setModalVisibility({ currentModal: "characterSelect", visible: true })}  lines="none" detail={false} button>
                <IonIcon slot="start" icon={peopleOutline} />
                <IonLabel>Character Select</IonLabel>
              </IonItem>
            </IonMenuToggle>
            {appPages.map((appPage) => {
              if (isPlatform("desktop") && appPage.appOnly) {
                return false;
              } else if (!isPlatform("desktop") && appPage.desktopOnly) {
                return false;
              } else {
                return (
                  <IonMenuToggle key={`mobile-${appPage.title}`} autoHide={false}>
                    <IonItem className={modeName === appPage.modeName ? "selected" : null} routerLink={appPage.url} routerDirection="root" lines="none" detail={false} button>
                      <IonIcon slot="start" icon={appPage.iosIcon} />
                      <IonLabel>{appPage.title}</IonLabel>
                    </IonItem>
                  </IonMenuToggle>
                )
              }
            })}
          </IonList>
        </div>

        <div id="widescreenMenu">
          <IonGrid>
            <IonRow id="showMenuButtonContainer">
              <IonCol size={isWideFullMenuOpen ? "2" : "12"}>
                <IonButton key="wide-full-menu-open-item" onClick={() => setIsWideFullMenuOpen(isWideFullMenuOpen ? false : true)}  lines="none" detail={false} button>
                  <IonIcon slot="icon-only" icon={menuSharp} />
                </IonButton>
              </IonCol>
              {isWideFullMenuOpen &&
                <IonCol>
                  <p>FAT {`${APP_CURRENT_VERSION_NAME}.${LS_FRAME_DATA_CODE}`} - <span onClick={() => modeName !== "movedetail" && setActiveGameAlertOpen(true)}>{activeGame} <IonIcon icon={caretDownOutline} /></span> </p>
                </IonCol>
              }
            </IonRow>

            <IonRow className="menu-entry">
              <IonCol size={isWideFullMenuOpen ? "2" : "12"}>
                <IonButton className={isWideFullMenuOpen ? "dimmed-color" : null} fill="clear" disabled={modeName === "movedetail"} key="wide-charSelectItem" onClick={() => setModalVisibility({ currentModal: "characterSelect", visible: true })}  lines="none" detail={false} button>
                  <IonIcon slot="icon-only" icon={peopleOutline} />
                </IonButton>
              </IonCol>
              {isWideFullMenuOpen &&
                <IonCol>
                  <IonItem disabled={modeName === "movedetail"} onClick={() => setModalVisibility({ currentModal: "characterSelect", visible: true })} lines="none" button detail={false}>Character Select</IonItem>
                </IonCol>
              }
            </IonRow>
            
            {appPages.map((appPage) => {
              if (isPlatform("desktop") && appPage.appOnly) {
                return false;
              } else if (!isPlatform("desktop") && appPage.desktopOnly) {
                return false;
              } else {
                return (
                  <IonRow onClick={() => appPage.externalUrl ? window.open(appPage.externalUrl, '_blank') : false} key={`wide-${appPage.title}`} className={`${appPage.modeName === "settings" && isPlatform("desktop") ? "lines-bottom" : null} menu-entry`}>
                    <IonCol size={isWideFullMenuOpen ? "2" : "12"}>
                      <IonButton
                        fill="clear" className={`${modeName === appPage.modeName ? "selected" : null} ${isWideFullMenuOpen ? "dimmed-color" : null}`}
                        routerLink={appPage.url} routerDirection="root"
                        lines="none" detail={false}
                      >
                        <IonIcon slot="icon-only" icon={appPage.iosIcon} />
                      </IonButton>
                    </IonCol>
                    {isWideFullMenuOpen &&
                      <IonCol>
                        <IonItem routerLink={appPage.url} routerDirection="root" lines="none" detail={false}>{appPage.title}</IonItem>
                      </IonCol>
                    }
                  </IonRow>
                )
              }
            })}
          </IonGrid>
        </div>
        

        <CharacterSelectModal />
        <HelpModal />
        <WhatsNewModal />
        <IonAlert
          isOpen={activeGameAlertOpen}
          onDidDismiss={() => setActiveGameAlertOpen(false)}
          header={'Select Game'}
          inputs={[
            {
              name: '3S',
              type: 'radio',
              label: '3S',
              value: '3S',
              checked: activeGame === "3S"
            },
            {
              name: 'USF4',
              type: 'radio',
              label: 'USF4',
              value: 'USF4',
              checked: activeGame === "USF4"
            },
            {
              name: 'SFV',
              type: 'radio',
              label: 'SFV',
              value: 'SFV',
              checked: activeGame === "SFV"
            }
          ]}
         buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Select',
              handler: selectedGame => {
                setActiveGame(selectedGame);
              }
            }
          ]}
        />
      </IonContent>
    </IonMenu>
  );
};


const mapStateToProps = state => ({
  selectedCharacters: state.selectedCharactersState,
  modeName: state.modeNameState,
  activeGame: state.activeGameState,
})

const mapDispatchToProps = dispatch => ({
  setModalVisibility: (data)  => dispatch(setModalVisibility(data)),
  setModeName: (modeName)  => dispatch(setModeName(modeName)),
  setActiveGame: (gameName)  => dispatch(setActiveGame(gameName)),
})


export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ) (Menu)
);
