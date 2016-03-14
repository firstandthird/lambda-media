'use strict';

const im = require('imagemagick');
const S3 = require('../lib/s3.js');
const async = require('async');
const _ = require('lodash');
const Logr = require('logr');
const log = new Logr({
  defaultTags: ['handler'],
  type: 'json'
});

const config = {
  stage: process.env.STAGE,
  debug: process.env.DEBUG,
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION
  },
  host: process.env.HOST + process.env.STAGE
};

/* payload should look like:
 data : base64 string representing the image
 outputBucket : String (optional)
 outputFile : String (name of the file to output)
*/
const handlePOST = (event, context) => {
  const returnUrl = `${config.host}/${event.outputFile}`;
  const bucket = event.outputBucket ? event.outputBucket : config.s3.bucket;
  async.auto({
    resized: (done) => {
      im.resize({
        srcData: new Buffer(event.data, 'base64'),
        width: '50%',
        height: '50%'
      }, (err, stdout, stderr) => {
        if (stderr) {
          return done(stderr);
        }
        if (err) {
          return done(err);
        }
        done(null, stdout);
      });
    },
    store: ['resized', (done, result) => {
      const files = new S3(bucket);
      files.writeObject(event.outputFile, new Buffer(result.resized, 'binary'), (err) => {
        if (err) {
          return done(err);
        }
        return done(null);
      });
    }]
  }, (err) => {
    if (err) {
      return context.fail(err);
    }
    return context.succeed(returnUrl);
  });
};

const handleGET = (event, context) => {
  const bucket = event.outputBucket ? event.outputBucket : config.s3.bucket;
  const files = new S3(bucket);
  files.listObjects(null, (err, result) => {
    if (err) {
      return context.fail(err);
    }
    const fileList = [];
    _.each(result.Contents, (n) => {
      fileList.push(n.Key);
    });
    return context.succeed(fileList);
  });
};

module.exports.handler = (event, context) => {
  if (event.httpMethod === 'GET') {
    handleGET(event, context);
  } else {
    handlePOST(event, context);
  }
};
