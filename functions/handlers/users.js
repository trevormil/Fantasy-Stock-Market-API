const { db, firestoreRef } = require("../utils/admin");
const firebaseConfig = require("../utils/config");
const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const {
  validateSignUpData,
  validateLogInData,
  reduceUserDetails,
} = require("../utils/validators");

exports.signup = (req, res) => {
  let newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
    createdAt: firestoreRef.Timestamp.now(),
    accountBalance: 1000000.0,
  };

  const { valid, errors } = validateSignUpData(newUser);
  if (!valid) return res.status(400).json(errors);

  let token, userId;

  //Validating users
  db.doc(`/users/${newUser.userName}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ userName: "This username is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((tokenId) => {
      token = tokenId;
      newUser.userId = userId;
      delete newUser.password;
      delete newUser.confirmPassword;
      return db.doc(`/users/${newUser.userName}`).set(newUser);
    })
    .then(() => {
      const userDoc = db.doc(`/users/${newUser.userName}`);

      userDoc.collection("accountValue").add({
        accountValue: newUser.accountBalance,
        dateAndTime: firestoreRef.Timestamp.now(),
      });
      userDoc.collection("ownedStocks");
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLogInData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials. Please Try Again" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.getUserDetails = (req, res) => {
  db.doc(`/users/${req.user.userName}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(201).json(doc.data());
      } else
        return res.status(403).json({ general: "That User ID doesn't exist." });
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong." });
      console.error(err);
    });
};

exports.updateUserDetails = (req, res) => {
  /*let userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.userName}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details updated successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });*/
};
