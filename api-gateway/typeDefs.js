'use strict';
const fs = require('fs');
const path = require('path');
module.exports = { typeDefs: fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8') };