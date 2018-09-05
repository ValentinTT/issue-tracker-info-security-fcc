/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

const expect = require('chai').expect;
/*
const MongoClient = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
*/
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});
//const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const Schema = mongoose.Schema;

const IssueSchema = new Schema({
  issue_title: {
    type: String,
    required: true,
    unique: true
  },
  issue_text: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true
  },
  assigned_to: {
    type: String,
    required: true
  },
  status_text: {
    type: String,
    default: ""
  },
  created_on: {
    type: Date,
    default: Date.now()
  },
  updated_on: {
    type: Date,
    default: Date.now()
  },
  open: {
    type: Boolean,
    default: true
  }
});

const ProjectSchema = new Schema({
  projectName: {
    type: String,
    required: true
  },
  issues: [IssueSchema]
});

const Project = mongoose.model('Project', ProjectSchema);

module.exports = function(app) {

  app.route('/api/issues/:project')

    .get((req, res, next) => {
      let projectName = req.params.project;
      Project.findOne({
        projectName
      }, (err, proj) => {
        if (err) next(err);
        else if (!proj) res.send("There is no project called " + projectName);
        else {
          let issues = proj.issues;
          if (req.body.issue_title) issues = issues.filter(i => i.issue_title === req.body.issue_title);
          if (req.body.issue_text) issues = issues.filter(i => i.issue_text === req.body.issue_text);
          if (req.body.created_by) issues = issues.filter(i => i.created_by === req.body.created_by);
          if (req.body.assigned_to) issues = issues.filter(i => i.assigned_to === req.body.assigned_to);
          if (req.body.status_text) issues = issues.filter(i => i.status_text === req.body.status_text);
          if (req.body.created_on) issues = issues.filter(i => i.created_on.getTime() === req.body.created_on.getTime());
          if (req.body.updated_on) issues = issues.filter(i => i.updated_on.getTime() === req.body.updated_on.getTime());
          if (req.body.open) issues = issues.filter(i => i.open = req.body.open);
          res.send(issues);
        }
      });
    })

    .post((req, res, next) => {
      let projectName = req.params.project;
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
        res.send("Issue title, text and creator are required");
      Project.findOne({
        projectName: projectName
      }, (err, proj) => {
        if (err) next(err);
        else {
          if (proj) {
            proj.issues.push({
              issue_title: req.body.issue_title,
              issue_text: req.body.issue_text,
              created_by: req.body.created_by,
              assigned_to: req.body.assigned_to || "",
              status_text: req.body.status_text || "",
              created_on: new Date(),
              updated_on: new Date(),
              open: true
            });
            proj.save((err, doc) => {
              if (err) next(err);
              else res.send(doc.issues[doc.issues.length - 1]);
            });
          } else {
            new Project({
                projectName: projectName,
                issues: [{
                  issue_title: req.body.issue_title,
                  issue_text: req.body.issue_text,
                  created_by: req.body.created_by,
                  assigned_to: req.body.assigned_to || "",
                  status_text: req.body.status_text || "",
                  created_on: new Date(),
                  updated_on: new Date(),
                  open: true
                }]
              })
              .save((err, doc) => {
                if (err) next(err);
                else res.send(doc.issues[doc.issues.length - 1]);
              });
          }
        }
      });
    })

    .put((req, res, next) => {
      let projectName = req.params.project;
      if (!req.body._id) {
        res.send("no id specified");
      } else if (!req.body.issue_title && !req.body.issue_text && !req.body.created_by && !req.body.assigned_to && !req.body.status_text && !req.body.open) {
        res.send("no updated field sent");
      } else {
        Project.findOne({
          projectName
        }, (err, proj) => {
          if (err) {
            next(err);
          } else if (proj) {
            let projIssueIndex = proj.issues.findIndex(i => i._id.equals(mongoose.Types.ObjectId(req.body._id)));
            if (projIssueIndex !== -1) {
              if (req.body.issue_text)
                proj.issues[projIssueIndex].issue_text = req.body.issue_text;
              if (req.body.created_by)
                proj.issues[projIssueIndex].created_by = req.body.created_by;
              if (req.body.assigned_to)
                proj.issues[projIssueIndex].assigned_to = req.body.assigned_to;
              if (req.body.status_text)
                proj.issues[projIssueIndex].status_text = req.body.status_text;
              if (req.body.open)
                proj.issues[projIssueIndex].open = req.body.open;
              proj.issues[projIssueIndex].updated_on = new Date();
              proj.save((err) => {
                if (err) res.send("could not update " + req.body._id);
                else res.send("successfully updated");
              });
            } else {
              res.send("could not update " + req.body._id);
            }
          } else {
            res.send("could not update, " + projectName + " doesn't exist");
          }
        });
      }
    })
    .delete((req, res, next) => {
      let projectName = req.params.project;
      if (!req.body._id) res.send("_id error");
      else
        Project.findOne({
          projectName
        }, (err, proj) => {
          if (err) res.send("could not delete " + req.body._id);
          else if (proj) {
            let projIssueIndex = proj.issues.findIndex(i => {
              try {
                return i._id.equals(mongoose.Types.ObjectId(req.body._id));
              } catch (e) {
                return false;
              }
            });
            if (projIssueIndex !== -1) {
              proj.issues = [...proj.issues.slice(0, projIssueIndex), ...proj.issues.slice(projIssueIndex + 1)];
              proj.save(err => err ? res.send("could not delete " + req.body._id) : res.send("deleted"));
            } else res.send("could not delete " + req.body._id);
          } else res.send("could not delete " + projectName + " doesn't exist");
        });
    });
};