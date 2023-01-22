# FAT 3
Welcome to FAT! The most popular SFV app in the world! You can check out live versions of the app here:

[Webapp](https://fullmeter.com/fatonline)

[Mobile App](https://fullmeter.com/fat)
  
## Contributing to FAT

### Developing
If you'd like to contribute to FAT, please open an issue about what you're interested in doing. I won't accept a pull request without an issue, so don't waste your time. You can also discuss it with me in our [discord channel](https://discord.gg/BfrCaHKU5J)

### Frame Data & General data corrections
Frame Data corrections need to be fixed via our team's spreadsheet. We don't directly edit the JSON file. Please report any and all frame data mistakes in our [discord channel](https://discord.gg/9BK8hHS). The same goes for the Combos & Moveslist section.

## Reusing FAT source code
For more details, you can read the license but essentially anything you make with FAT's source code
- must be open source as well
- must link to this repository in your own repository
- must visibly credit FAT in the final product 

## Developing for FAT
FAT is an Ionic React app built with Capacitor. You'll need npm to get going and then

### Setup
```
npm install
```
You'll need the Ionic CLI
```
npm install -g @ionic/cli
```

### Run
To run the project in your browser do
```
ionic serve
```
To build the project with Capacitor do
```
ionic build

// android or ios
ionic cap sync android
```
To open the project in Android Studio you can do
```
ionic cap open android
```
This requires you to point Capacitor at the location of your Android Studio installation. You can set this up by adding/editing local.properties in ./android. For example
```
sdk.dir=/home/you/location/of/Android/Sdk
```

## Deployment
Add a new version log and bump the 3 constants at the top of the page to the correct values in ```src/js/constants/VersionLogs.js```. Also adjust the FrameData and GameDetails codes as required.

If previously remote fetched characters have been moved to the local build, be sure to remove their remoteImage Boolean from the sheet

Because it's Capacitor, you'll need to build for iOS and Android in XCode and Studio respectively.

Bump the versionCode and versionName in ```android/app/build.gradle```

Deploying to the web is just a matter of setting the homepage in ./package.json with
```
"homepage": "/subdirectory/to/deploy/to"
```
and then doing
```
ionic build
```
## Adding a new game

Changes to `./src/js/actions/index.ts` 
- Import the framedataJSON
- Dispatch the frame data in getFrameData()
- If the game requires state switchers (like VT) amend setPlayer()
- Import the gamedetailsJSON
- Dispatch the game details in getGameDetails()

General Changes
- Add the menu Radio in `src/js/components/Menu.tsx`
- Set up the Game Details in `src/js/constants/GameDetails.ts`
- Add to type GameName in `src/js/types/index.ts`
- Add to type VtState in `src/js/types/index.ts`

Updatable Game (if the game is going to receive server updates)
- Add to the UDPATABLE_GAMES and UPDATABLE_GAMES_APP_CODES obj in `src/js/constants/VersionLogs.ts`
