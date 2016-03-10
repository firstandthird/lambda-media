'use strict';

const im = require('imagemagick');
const s3 = require('../lib/s3.js');
const async = require('async');
const Logr = require('logr');
const log = new Logr({
  defaultTags: ['handler'],
  type: 'json'
});

const config = {
  debug: process.env.DEBUG,
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION
  }
};

/* payload should look like:
 data : base64 string representing the image
 outputBucket : String (optional)
 outputFile : String (name of the file to output)
*/
module.exports.handler = (event, context) => {
  const bucket = event.outputBucket ? event.outputBucket : config.s3.bucket;
  async.auto({
    resized: (done) => {
      im.resize({
        srcData: new Buffer(event.data.base64, 'base64'),
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
      const files = new s3(bucket);
      files.writeObject(event.outputFile, new Buffer(result.resized, 'binary'), (err) => {
        if (err) {
          return done(err);
        }
        return done(null);
      });
    }]
  }, (err) => {
    if (err) {
      console.log(err);
      return context.fail(false);
    }
    return context.succeed(true);
  });
};
