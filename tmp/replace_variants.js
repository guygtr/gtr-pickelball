const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

walk(path.resolve('../src'), function(err, results) {
  if (err) throw err;
  
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const replacements = {
      'variant="green"': 'variant="primary"',
      'variant="blue"': 'variant="secondary"',
      'variant="pink"': 'variant="tertiary"',
      'variant="orange"': 'variant="muted"',
      "variant='green'": "variant='primary'",
      "variant='blue'": "variant='secondary'",
      "variant='pink'": "variant='tertiary'",
      "variant='orange'": "variant='muted'"
    };

    for (const [oldVal, newVal] of Object.entries(replacements)) {
      if (content.includes(oldVal)) {
        content = content.replace(new RegExp(oldVal, 'g'), newVal);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated: ${file}`);
    }
  });
});
