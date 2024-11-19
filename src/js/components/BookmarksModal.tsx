import { IonButton, IonContent, IonIcon, IonItem, IonList, IonModal } from "@ionic/react";
import { useDispatch, useSelector } from "react-redux";
import { bookmarksSelector, modalVisibilitySelector } from "../selectors";
import { setModalVisibility } from "../actions";
import CharacterPortrait from "./CharacterPortrait";
import "../../style/components/BookmarksModal.scss"
import { closeOutline, closeSharp, remove } from "ionicons/icons";
import { useHistory } from "react-router";
import PageHeader from "./PageHeader";

const BookmarksModal = () => {

  const modalVisibility = useSelector(modalVisibilitySelector);
  const bookmarks = useSelector(bookmarksSelector)

  const dispatch = useDispatch();
  const history = useHistory();

  const handleModalDismiss = () => {  
    modalVisibility.visible && dispatch(setModalVisibility({ currentModal: "bookmarks", visible: false }))
  }

  return (
    <IonModal
      id="BookmarksModal"
      isOpen={modalVisibility.visible && modalVisibility.currentModal === "bookmarks"}
      onDidDismiss={ () => {
        handleModalDismiss();
      } }
    >
      <PageHeader
        buttonsToShow={[{ slot: "end",
          buttons: [
            { text: <IonIcon icon={closeSharp} style={{fontSize: "24px"}} />, buttonFunc: () => handleModalDismiss()}
          ]
        }]}
        title="Bookmarks"
      />
      <IonContent>
        <IonList>
          {bookmarks.map((bookmark, index) => {
            return (
              <IonItem onClick={() => {
                history.replace(`/${bookmark.modeName}/${bookmark.gameName}/${bookmark.characterName}`);
                handleModalDismiss();
              }} routerDirection="root">
                <div className="bookmark-entry">
                  <IonButton fill="clear"><IonIcon slot="icon-only" icon={closeOutline}></IonIcon></IonButton>
                  <CharacterPortrait
                    charName={bookmark.characterName}
                    game={bookmark.gameName}
                    charColor={"#ffff00"}
                    remoteImage={false}
                    showName={false}
                    selected={true}
                  ></CharacterPortrait>
                  <div className="details">
                    <h1>{bookmark.gameName} - {bookmark.characterName}</h1>
                    <div>some other details</div>
                  </div>
                </div>
              </IonItem>
            )
          })}
        </IonList>
      </IonContent>
      
    </IonModal>
  )
}

export default BookmarksModal;