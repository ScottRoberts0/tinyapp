//FUNCTIONS
const generateRandomString = function() {
  let str = "";
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    str += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return str;
};

const emailLookup = function(userEmail, database) {
  const keys = Object.keys(database);
  for (const key of keys) {
    if (database[key].email === userEmail) {
      return true;
    }
  }
  return false;
};

const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

const urlsForUser = function(id, database) {
  let urlsList = {};
  for (let key in database) {
    if (database[key].userID === id) {
      urlsList[key] = database[key];
    }
  }
  return urlsList;
};

module.exports = {
  generateRandomString,
  emailLookup,
  getUserByEmail,
  urlsForUser
}