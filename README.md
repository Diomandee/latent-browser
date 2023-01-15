# Latent Web Browser

A browser for web content generated by GPT-3.

Check out the Discord for news, updates, tips, and feature requests! https://t.co/uySHZIr3cc

<a href="https://www.buymeacoffee.com/flngr" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Sushi" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a> (well, a sushi actually)

See the latest demo here! https://twitter.com/flngr/status/1609616068057698304

<img src="https://raw.githubusercontent.com/jbilcke/latent-browser/main/docs/images/screenshot-4.jpg?sanitize=true" width="100%" />

## Presentation

this project is free but experimental, you will have to configure your own API credentials to access OpenAI (for GPT-3 / text-davinci-003, and dall-e 2).

Currently Replicate (stable diffusion) is disabled, as I had some latency issues with it (maybe I will put it back in the future!)

## Quick start

### Prerequisites

You will need NVM and Node 18.12.1

### Initial setup

```bash
cd latent-browser
nvm use
yarn
```

Don't mind too much those errors (we don't use IPFS yet):

```
electron@npm:1.8.8 couldn't be built successfully
wrtc@npm:0.4.7 couldn't be built successfully
```

The app will still load just fine.

### BEFORE YOU RUN THE APP /!\

This application is based on OpenAI for text and image generation.

\*You need a valid (billable) OpenAI account before you can use the application.

Upon starting it, you will have to enter you OpenAI token in the configuration panel (the "cog" icon).

### Running the app in development

You have 3 different options to run the app:

#### In a browser (recommended)

This solution is recommended during development or if you experience build issues.

```bash
yarn start
```

Then go to http://localhost:1420

#### Generate a production build for yourselves (advanced)

This is not recommended for day-to-day development as it is slow, and currently there is an issue with images.

```bash
yarn release
```

then:

- copy the app to your Application dir
- start the app

### Known important bugs

- Speech input doesn'tseem to work when starting to app with `yarn tauri:dev`
- Images don't seem to work when runing a standalone built using `yarn release`, it might be caused by a security setting.

## Using the browser

### Working (most of the time) examples

Here are some examples to get you started:

- `a back-office application to manage users. There is a table with editable cells, a button to add a new user, and a counter of users.`
- `a simulation of calculating PI by generating random dots inside a circle. The simulator should include a slider to adjust the speed, a reset button, and the current estimate of PI.`
- `a simple app to compute your BMI, using form inputs for age, height and weight (in kilos)`
- `a whack-a-mole game but with spiders, a css 3-per-3 grid, emojis, and JS code`
- `a clone of asteroid using <canvas>, the mouse should orient the spaceship, it should fire bullets when clicking, and bullets can destroy asteroids.`
- `website for a company selling time travel visit packages (great pyramids, Trojan wars..). The website features 3 polaroid pictures taken by tourists of those eras`

### Non-working examples

Those examples don't work yet.. maybe one day in text-davinci-004 or 005?

- `a 120 BPM drum machine made using tone.js, with a step sequencer made using html checkboxes, to indicate when to play. Each row should be a different instrument (kick, snare, hihat), 8 buttons per row. There is a button to start/stop.`

## FAQ

### The UI/UX should be improved

I agree!

### Uhh.. something went wrong

Try clicking again on generate 🎲

### No I mean, something went REALLY wrong

Maybe you did too many requests to OpenAI?

### I don't.. know?

Wait a bit then restart the application, eg. kill it from the terminal.

## Developer Guide (work in progress)

### Development mode (web)

If you are developing on the latent browser, you will want to run it in development mode:

```bash
yarn dev
```

Then go to http://localhost:1420

Note: development mode can be a bit a bit frustrating, as we have a lot of dependencies so it takes quite a while to load tabs.

Sometimes it also lazy load them, compile in the background, then refresh the page.
Don't be surprised if that happens while you were trying to type something!

### Development mode (tauri)

There is also a way to run Tauri in develpment mode.

This solution requires a working Rust environment, and is recommended if you need to develop things interacting with the OS (eg. custom windows, system toolbar, auto updater..)

```bash
yarn tauri:dev
```

Note: speech recognition won't work here, as the Info.plist file won't be recognized for some reason.

### HTTP Request Mocking

Today the Latent Browser can mock the following file formats when the generated code tries to access them:

- `.jpg`, `.jpeg`, `.webm`, `.tga`, `.gif`, `.bmp` -> `mockImage(filename)`
- `.json` -> `mockJSON(filename)`
- `.txt` -> `mockText(filename)`
- `.stl` -> `mockSTL(filename)`
- `.svg` -> `mockSVG(filename)`
- `.*` -> `mockAny(filename, extension)`

You can find the code doing the mocking in `src/pages/api/mocker/[filename].ts`.

You can find the mocking prompts in `src/engine/prompts/mocker/`.

Do not hesitate to propose improvements to those prompts!
