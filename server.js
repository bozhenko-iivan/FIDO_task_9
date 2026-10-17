const express = require("express");
const quotesRouter = require('./quotes');

const app = express();

app.use(express.json());
app.use('/quotes', quotesRouter);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});