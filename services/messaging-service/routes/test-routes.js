const fs = require('fs');
const content = fs.readFileSync('serverRoutes.js','utf8');
const routes = content.match(/router\.post\(['"](.*)['"]/g);
console.log(routes);
