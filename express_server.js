const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

//GLOBAL OBJECTS
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "jJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//GET AND POST REQUESTS
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {

 
  if(req.cookies["user_id"]){  


    let urlsList = urlsForUser(req.cookies["user_id"]);

    let templateVars = {
    urls: urlsList,
    user: users[req.cookies["user_id"]]
    };

  res.render("urls_index", templateVars);
  }else{

  let templateVars = {
    urls: {},
    user: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if(req.cookies["user_id"]){
    res.render("urls_new", templateVars);
  }else{
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const longUrl = req.body.longURL;
  const randomKey = generateRandomString();
  urlDatabase[randomKey] = longUrl;
  res.redirect("/urls/" + randomKey);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  if(req.cookies["user_id"] === urlDatabase[req.params.id].userID){
   urlDatabase[req.params.id].longURL = req.body.longURL;
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID){
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;
  console.log(req.body);
  if(!emailLookup(users, email)){
    res.status(403).send("403 ERROR: Email not found!");
  }else{
  let id = findID(email);
 
  if(id && bcrypt.compareSync(pass, users[id].password)){
    res.cookie('user_id', id);
    res.redirect("/urls");
  }else{
    res.status(403).send("403 ERROR: UID not found or password incorrect");
  }
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
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
  } else if (emailLookup(users, newUserEmail)){
    res.status(400).send(" Error 400, This email address is already registered");
  } else {
    users[newUserID] = {
      id: newUserID,
      email: newUserEmail,
      password: newUserPass
    }

    console.log(users);
    res.cookie('user_id', newUserID);
    res.redirect("/urls");
  }
});

//SERVER LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//RANDOM STRING GENERATOR
function generateRandomString() {
  let str = "";
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    str += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return str;
};

function emailLookup(userObj, userEmail) {
  const keys = Object.keys(userObj);
  for (const key of keys) {
    if (userObj[key].email === userEmail) {
      return true;
    }
  }
  return false;
};

function findID(email){
  
  for(let key in users){
    if(users[key].email === email){
      return key;
    }
  }
  return undefined;
}

function urlsForUser(id){
let urlsList = {};
  for(let key in urlDatabase){
    if(urlDatabase[key].userID === id){
      urlsList[key] = urlDatabase[key];
    }
  }
return urlsList;
}