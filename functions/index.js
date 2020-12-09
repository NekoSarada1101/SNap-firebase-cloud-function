const functions = require('firebase-functions');

// cloud functionでfirestoreを使うのに必要な設定は以下の２行
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

// データベースの参照を作成
const fireStore = admin.firestore()

exports.sendMessage = functions.firestore
  .document('users/{userID}/applicated_follows/{documentID}')
  .onCreate((change, context) => {
    console.log("STRAT:sendMessage");
    const payload = {
      notification: {
        title: "SNap",
        body:"フォロー申請されました！",
        badge: "1",
        sound: "default"
      }
    };

    const option = {
      priority: "high"
    };
    let userRef = fireStore.collection('users').doc(context.params.userID);
    let getUser = userRef.get()
      .then(doc => {
        if (!doc.exists) {
          console.log('No such document!');
        } else {
          admin.messaging().sendToDevice(doc.data()["fcm_token"], payload, option);
          console.log('Document data:', doc.data());
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
    const connectionName ='snap-6cc78:asia-northeast1:snap';
    const pool  = mysql.createPool({
      connectionLimit : 30,
      socketPath: `/cloudsql/${connectionName}`,
      user: "root",
      password: "y3u736jA1416OubP",
      database: "SNap"
    });
    const insert = "INSERT INTO posts(documentID,message) VALUES(?,?);"

    pool.getConnection(function(err, connection){
      if(err){
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
                connection.query(insert,[doc.id,doc.data()["message"]],function(err, result, fields){
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
