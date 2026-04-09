const { Vibrant } = require('node-vibrant/node');
const path = require('path');

const imagePath = path.resolve('../Balle de pickelball v2.png');
Vibrant.from(imagePath).getPalette()
  .then(palette => {
    const result = {
      Vibrant: palette.Vibrant?.hex,
      Muted: palette.Muted?.hex,
      DarkVibrant: palette.DarkVibrant?.hex,
      DarkMuted: palette.DarkMuted?.hex,
      LightVibrant: palette.LightVibrant?.hex,
      LightMuted: palette.LightMuted?.hex,
    };
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error("Error analyzing image:", err);
  });
