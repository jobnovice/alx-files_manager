const express = require('express');

const app = express();
const routes = require('./routes');
const port = process.env.PORT || 5000;

app.use('/',routes);

app.listen(port, (err) => {
    if (err) {
        console.error(`Error starting server: ${err}`);
    } else {
        console.log(`Server is running on port ${port}`);
    }
});

module.exports = app;

