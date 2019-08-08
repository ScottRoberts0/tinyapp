const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const { generateRandomString, emailLookup, getUserByEmail, urlsForUser } = require('./helpers');

const cookieParser = require('cookie-parser');


app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//GLOBAL OBJECTS
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW", dateCreated: "19-10-2018", totalVisits: 0, uniqueVisits: 0, visitTracker: [] },
  i3BoGr: { longURL: "https://www.google.ca", userID: "jJ48lW", dateCreated: "10-03-2016", totalVisits: 0, uniqueVisits: 0, visitTracker: [] },
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}


//GET AND POST REQUESTS
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let urlsList = urlsForUser(req.session.user_id, urlDatabase);

    let templateVars = {
      urls: urlsList,
      user: users[req.session.user_id]
    };

    res.render("urls_index", templateVars);
  } else {
    let templateVars = {
      error: 503,
      msg: "Access Denied. User Not Logged In",
      user: users[req.session.user_id]
    };
    res.status(503).render("error_page", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {

  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).render("error_page", { error: 404, msg: "URL not FOUND", user: users[req.session.user_id] });
  } else {
    if (!users[req.session.user_id]) {
      res.status(401).render("error_page", { error: 404, msg: "Not Signed In", user: users[req.session.user_id] });
    }
    if (urlDatabase[req.params.shortURL].userID !== req.session.user_id){
      res.status(401).render("error_page", { error: 404, msg: "Not Authorized", user: users[req.session.user_id] });
    }
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
      visits: urlDatabase[req.params.shortURL].totalVisits,
      uniqueVisits: urlDatabase[req.params.shortURL].uniqueVisits,
      visitList: urlDatabase[req.params.shortURL].visitTracker
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).render("error_page", { error: 404, msg: "ShortURL does not exist", user: users[req.session.user_id] });
  }else{
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const url = req.params.shortURL;
  if (!req.cookies[url]) {
    res.cookie(url, "visited");
    urlDatabase[req.params.shortURL].uniqueVisits += 1;
  }


  const visitorID = generateRandomString();
  const date = new Date();
  const utcDate = date.toUTCString();

  urlDatabase[req.params.shortURL].visitTracker.push([visitorID, utcDate]);



  urlDatabase[req.params.shortURL].totalVisits += 1;
  res.redirect(longURL);
}
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(401).render("error_page", { error: 404, msg: "Not Signed In", user: users[req.session.user_id] });
  }
  
  const longUrl = req.body.longURL;
  const randomKey = generateRandomString();
  let current_datetime = new Date()
  let formatted_date = current_datetime.getDate() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getFullYear()

  const userName =
    urlDatabase[randomKey] = {
      longURL: longUrl,
      userID: req.session.user_id,
      dateCreated: formatted_date,
      totalVisits: 0,
      uniqueVisits: 0,
      visitTracker: []
    }

  res.redirect("/urls/" + randomKey);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;

  if (!emailLookup(email, users)) {
    res.status(403).send("403 ERROR: Email not found!");
  } else {
    let id = getUserByEmail(email, users);

    if (id && bcrypt.compareSync(pass, users[id].password)) {
      req.session.user_id = id;
      res.redirect("/urls");
    } else {
      res.status(403).send("403 ERROR: UID not found or password incorrect");
    }
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("user_register", templateVars);

});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  //hashed password
  const newUserPass = bcrypt.hashSync(req.body.password, 10);

  if (!newUserEmail || !newUserPass) {
    res.status(400).send("Error 400, Email and Password fields cannot be left blank");
  } else if (emailLookup(newUserEmail, users)) {
    res.status(400).send(" Error 400, This email address is already registered");
  } else {
    users[newUserID] = {
      id: newUserID,
      email: newUserEmail,
      password: newUserPass
    }

    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

//SERVER LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
