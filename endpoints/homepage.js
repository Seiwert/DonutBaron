"use strict"

var db = require('../db');

// A controller for the equipment resource
// This should have methods for all the RESTful actions
class Homepage {
  //Gets and renders the data needed for the homepage
  getHomepageData(req, res) {
    db.get('SELECT * FROM users WHERE is_donut_baron=?', 1, function(err, donutBaron) {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      db.all('SELECT * FROM upcomingList', function(err, upcomingUsers) {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        };
        res.render('index', { donutBaron: donutBaron, upcomingUsers: upcomingUsers, user: req.user } );
      });
    });
  }
  
  //Updates the database when a user rates the current donut baron.
  RateDonuts(req, res) {
    var reliability = 0;
    if(typeof req.body.delivered == "undefined") {
        reliability = 100;
    }
    db.run("UPDATE users SET has_rated_this_week=1 WHERE userID=?",
          req.user.userID);
    db.get("SELECT * FROM users WHERE is_donut_baron=?", 
          1, 
      function(err, donutBaron) {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        db.run("UPDATE users SET donut_quality_rating=?, donut_reliability_rating=?, number_of_ratings=? WHERE userID=?",
          //The current rating is multiplied by the number of ratings, then the new rating is added, then everything is divided by the previous number of ratings + 1. 
          Math.round(((donutBaron.donut_quality_rating * donutBaron.number_of_ratings) + parseInt(req.body.score))/(donutBaron.number_of_ratings + 1) * 10) / 10,
          //Same as quality, but for reliability.
          Math.floor((donutBaron.donut_reliability_rating * donutBaron.number_of_ratings) + reliability)/(donutBaron.number_of_ratings + 1),
          donutBaron.number_of_ratings + 1,
          donutBaron.userID);
        db.all('SELECT * FROM upcomingList', function(err, upcomingUsers) {
          if (err) {
            console.error(err);
            return res.sendStatus(500);
          };
          res.redirect("/#rate");
        });
      });
  }
    //Gets all comments to display them
    getComments(req, res) {
        db.all('SELECT * FROM comments', function(err, commentsArray) {
            if(err) {
                console.error(err);
                return res.sendStatus(500);
            }
            res.send(commentsArray);
        });
    }
    //Adds a new comment into the database when a user makes one.
    addComment(req, res) {
        db.run('INSERT INTO comments (content, fullname, created, upvote_count, user_has_upvoted) values (?,?,?,?,?)',
            req.body.comment.content,
            req.body.currentUser,
            req.body.comment.created,
            parseInt(req.body.comment.upvote_count),
            req.body.comment.user_has_upvoted == 'true' ? 1 : 0
        );
        //Need to convert string values back to their original types.
        req.body.comment.user_has_upvoted = (req.body.comment.user_has_upvoted == 'true' ? true : false);
        req.body.comment.upvote_count = parseInt(req.body.comment.upvote_count);
        req.body.comment.created_by_current_user = (req.body.comment.created_by_current_user == 'true' ? true : false);
        res.send(req.body.comment); 
    }
  
}

module.exports = exports = new Homepage();
