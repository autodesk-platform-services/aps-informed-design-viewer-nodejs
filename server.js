const express = require("express");
const session = require("cookie-session");
const { PORT } = require("./config.js");

let app = express();
app.use(express.static("wwwroot"));
app.use(
  session({
    secret: Math.random().toString(36).substring(2, 15),
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(require("./routes/auth.js"));

app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}...`);
});
