# z00m

z00m is a small group video-calling web app built in four days in April 2020 so that members of a private group could meet in a single shared video room. A member opens the page, taps "Click to Join", enters a nickname and a phone number, and, if the number belongs to a registered member, joins one shared room with camera and microphone. The app fetches an access token for the Twilio Programmable Video service from a serverless Twilio Function, connects to the room with the `twilio-video` SDK, and lays out every participant's video in a grid that adapts to the number of people and to portrait or landscape orientation, with a button to leave the call. It is a React 16 single-page app made with Create React App and Material-UI, designed mainly for mobile browsers, and its interface text is partly in Indonesian. The production build is committed to `docs/` and served by GitHub Pages. It is not maintained.

> Built in April 2020. Not maintained. Joining a call depends on the external Twilio token service still running.

**Live demo:** https://www.rach.im/z00m/

## Features

- Landing screen with a "Click to Join" card, then a login form for nickname (at least 4 characters) and phone number
- Member check: only phone numbers on a built-in member list can join
- One shared Twilio Video room (`z00m`) with audio and front-camera video
- Adaptive video grid: 1 to 18 participants are arranged in 1 to 5 boxes per row, and each video is scaled to fill its box
- Portrait and landscape layouts, with re-layout on resize
- Leave-call button that disconnects and reloads the page
- iOS Safari fixes for pinch-zoom and double-tap zoom

## Tech stack

React 16 · Create React App 3 · Material-UI 4 · Twilio Video (`twilio-video`) · Axios · GitHub Pages

## Getting started

Prerequisites: Node.js and npm.

```bash
npm install
npm start       # development server on http://localhost:3000
npm test        # Jest test runner (no project tests yet)
npm run build   # production build, then renames build/ to docs/
```

The `build` script uses the Windows `rename` command to move `build/` to `docs/`; on macOS or Linux, run `react-scripts build` and move the folder yourself. The `homepage` field in `package.json` controls the base path of the build (`/z00m/`).

## How it works

- `src/AppContext.js` holds the app state in a reducer. `getRoomToken` posts the identity and room name to the token service, `startVideo` creates the local audio/video tracks and connects to the room, and remote participants' tracks are attached as they subscribe and removed when they leave.
- `src/comp/LoginScreen.js` validates the form and checks the last 8 digits of the phone number against the member list before requesting a token.
- `src/comp/HomeScreen.js` starts the video once a token is available and shows the leave button.
- `src/comp/MobileScreen.js` arranges the `<video>` elements in a flex grid and scales each one to cover its viewport.

## Project structure

```text
src/App.js                 shows LoginScreen or HomeScreen depending on the token
src/AppContext.js          state, Twilio token request and room connection
src/comp/LoginScreen.js    join card and login form
src/comp/HomeScreen.js     call screen with the leave button
src/comp/MobileScreen.js   responsive video grid
public/                    CRA static files
docs/                      committed production build served by GitHub Pages
```
