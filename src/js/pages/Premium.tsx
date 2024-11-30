import "cordova-plugin-purchase";
import "../../style/pages/Premium.scss";

import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonMenuButton, IonModal, IonPage, IonTitle, IonToolbar, isPlatform } from "@ionic/react";
import { diamondSharp } from "ionicons/icons";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

import bookmarkImage from "../../images/premium-examples/bookmarks.png";
import { purchaseLifetimePremium, resetPremium } from "../actions";
import ChunkyButton from "../components/ChunkyButton";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { APP_CURRENT_VERSION_CODE } from "../constants/VersionLogs";
import { premiumSelector } from "../selectors";

const Premium = () => {
  const { store: iapStore } = CdvPurchase;
  const location = useLocation();
  const dispatch = useDispatch();
  const premiumIsPurchased = useSelector(premiumSelector).lifetimePremiumPurchased;

  const [premiumModalIsOpen, setPremiumModalIsOpen] = useState(false);
  const [tipAdded, setTipAdded] = useState(false);

  const prices = useMemo(() => {
    const basePricing = iapStore?.get("com.fullmeter.fat.premium_lifetime")?.pricing;
    const withTipPrice = iapStore?.get("com.fullmeter.fat.premium_lifetime_tip")?.pricing;

    if (!basePricing || !withTipPrice) return null;

    const priceDiff = (withTipPrice.priceMicros - basePricing.priceMicros) / 1000000;
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: basePricing.currency,
      minimumFractionDigits: 2,
      currencyDisplay: "narrowSymbol",
    });

    return {
      base: basePricing.price,
      withTip: withTipPrice.price,
      tipAmount: formatter.format(priceDiff),
    };
  }, [iapStore]);

  const buyPremium = () => {
    iapStore.get(
      !tipAdded ? "com.fullmeter.fat.premium_lifetime" : "com.fullmeter.fat.premium_lifetime_tip",
      isPlatform("android") ? CdvPurchase.Platform.GOOGLE_PLAY : CdvPurchase.Platform.APPLE_APPSTORE
    )?.getOffer()?.order();
  };

  return (
    <IonPage id="Premium">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {location.pathname === "/premium"
              ? <IonMenuButton />
              : <IonBackButton defaultHref="/settings"></IonBackButton>
            }
          </IonButtons>
          <IonTitle>Premium</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {premiumIsPurchased ?
          <IonItem style={{"--border-radius": "10px"}} >
            <IonIcon aria-hidden="true" icon={diamondSharp} slot="start" size="large" color={"primary"}></IonIcon>
            <IonLabel>
              <h1>Premium Purchased</h1>
              <p>Thank you for supporting FAT! Here's what you're getting.</p>
            </IonLabel>
          </IonItem>
          :
          <>
            <article>
              <p>Hi I'm Paul! I've been developing and releasing FAT ad-free for over 10 years now. All core features and data (and pretty much everything else!) will always be free forever!</p>
              <p>However, if you'd like to support me, Premium is a <strong>one-time purchase</strong> which gives you access to a few helpful extra features as a thank you.</p>
              {isPlatform("ios") &&
                <IonButton expand="full" shape="round" mode="ios" onClick={() => iapStore.restorePurchases()}>Restore Premium Purchase</IonButton>
              }
            </article>
          </>

        }

        <article>

          <section>
            <h1>Unlimited Bookmarks</h1>
            <hr></hr>
            <p>Become a true power user with unlimited bookmarks! That means quickly checking characters and moves, even across different games.</p>
            <img style={{borderRadius: "12px"}} src={bookmarkImage} alt="Bookmark example"></img>
          </section>

          <section>
            <h1>App Themes</h1>
            <hr></hr>
            <p>Want to stand out from the crowd? Sick of the colour blue? Then app themes are for you! Choose from 4 new themes which work in both light and dark mode!</p>
            <ThemeSwitcher
              premiumPreview={true}
              lines={false}
            ></ThemeSwitcher>
          </section>

          <section>
            <h1>Priority Support</h1>
            <hr></hr>
            <p>I do my best to reply to all emails as soon as I can but life can be hectic! Emails from users who have premium get replies first as priority. Simply tap the email button in settings{premiumIsPurchased && " "}{premiumIsPurchased && <a href={`mailto:apps@fullmeter.com?subject=FAT-${"P~"}${APP_CURRENT_VERSION_CODE} | SUBJECT_HERE`}>or click here</a>}.</p>
          </section>

        </article>
        {/* DEBUG BUTTON */}
        {/* {!isPlatform("capacitor") &&
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={() => premiumIsPurchased ? dispatch(resetPremium()) : dispatch(purchaseLifetimePremium())}>
              <IonIcon icon={diamondSharp}></IonIcon>
            </IonFabButton>
          </IonFab>
        } */}
        {
          !premiumIsPurchased &&
            <ChunkyButton
              extraText="See Options"
              onClick={() => setPremiumModalIsOpen(true)}
            >Upgrade to Premium!</ChunkyButton>
        }

        {/* styled globally as modals are presented at root  */}
        <IonModal className="premium-offer-modal" showBackdrop={true} isOpen={premiumModalIsOpen} initialBreakpoint={1} breakpoints={[0, 1]} onDidDismiss={() => setPremiumModalIsOpen(false)}>
          <div className="premium-offer-modal-content">
            {!premiumIsPurchased ? (
              <>
                <IonButton expand="full" shape="round" mode="ios" onClick={buyPremium}>
                  {`Lifetime Premium ${tipAdded ? "+ Tip" : ""} ${prices ? `(${tipAdded ? prices.withTip : prices.base})` : ""}`}
                </IonButton>
                <IonItem>
                  <IonCheckbox checked={tipAdded} onIonChange={() => setTipAdded(!tipAdded)}>
                    {`Add a tip for Paul ${prices ? `(+${prices.tipAmount})` : ""}`}
                  </IonCheckbox>
                </IonItem>
                <p><em>Adding a tip to your purchase is completely optional, and provides no extra features. It's simply a way to give a little extra support to FAT. Either way, thank you for considering purchasing premium!</em></p>
              </>
            ) : (
              <p>Thanks for purchasing Premium. I really appreciate your support!</p>
            )}
          </div>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Premium;