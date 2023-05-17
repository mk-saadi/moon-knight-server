const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("animeFig server is running");
});

app.listen(port, () => {
    console.log(`animeFig server is running at ${port}`);
});
