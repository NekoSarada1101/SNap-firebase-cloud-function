const functions = require('firebase-functions');

// cloud functionでfirestoreを使うのに必要な設定は以下の２行
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

// データベースの参照を作成
const fireStore = admin.firestore()

exports.goodNotification = functions.https.onCall((data, context) => {
  console.log("STRAT:goodNotification");
  console.log("to " + data.uid);
  const payload = {
    notification: {
      title: "good",
      body: "あなたの投稿がいいねされました！",
      badge: "1",
      sound: "default",
      tag: data.postPath
    }
  };

  const option = {
    priority: "high"
  };

  let userRef = fireStore.collection('users').doc(data.uid);
  return userRef.get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log("START:sendToDevice");
        return admin.messaging().sendToDevice(doc.data()["fcm_token"], payload, option)
          .then(() => {
            return console.log(doc.data()["fcm_token"]);
          }).catch(err => {
            console.log(err);
          });
      }
      return doc.data();
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });

});

exports.sendMessage = functions.firestore
  .document('users/{userID}/applicated_follows/{documentID}')
  .onCreate((change, context) => {
    console.log("STRAT:sendMessage");
    console.log("to " + context.params.userID);
    const payload = {
      notification: {
        title: "applicated_follow",
        body: "フォロー申請されました！",
        badge: "1",
        sound: "default",
        tag: "applicated_follow"
      }
    };

    const option = {
      priority: "high"
    };
    let userRef = fireStore.collection('users').doc(context.params.userID);
    return userRef.get()
      .then(doc => {
        if (!doc.exists) {
          console.log('No such document!');
        } else {
          console.log("START:sendToDevice");
          console.log(doc.data()["fcm_token"]);
          return admin.messaging().sendToDevice(doc.data()["fcm_token"], payload, option);
        }
        return doc.data();
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
  });

exports.myFunction = functions.firestore
  .document('posts/{documentID}')
  .onWrite((change, context) => {
    console.error("success!!");

    const mysql = require('mysql');
    const secret = require('./secret');
    const connectionName = secret.connectionName;
    const pool = mysql.createPool({
      connectionLimit: 30,
      socketPath: `/cloudsql/${connectionName}`,
      user: secret.user,
      password: secret.password,
      database: "SNap"
    });
    const insert = "INSERT INTO posts(id,message) VALUES(?,?);"

    pool.getConnection(function (err, connection) {
      if (err) {
        return console.log(err);
      }
      connection.query(`DELETE FROM posts`, (e, results) => {
        if (e) {
          console.error(e);
        } else {
          console.log("delete:success!!");
          let postRef = fireStore.collection('posts');
          let allPosts = postRef.get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                connection.query(insert, [doc.id, doc.data()["message"]], function (err, result, fields) {
                  if (err) throw err;
                });
              });
              console.log("complete!!");
              return doc.data();
            })
            .catch(err => {
              console.log('Error getting documents', err);
            });
        }
      });
    });
  });
