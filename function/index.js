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

/* payload loks like:
 data : base 64 string
 outputBucket : String (optional)
 outputFile : String
 operations : String (comma-separated list)
*/
module.exports.handler = (event, context) => {
  const bucket = event.outputBucket ? event.outputBucket : config.s3.bucket;
  // // load image
  console.log('writing %s/%s', bucket, event.outputFile);
  const files = new s3(bucket);
  console.log("created s3 interfrace");
  files.writeObject(event.outputFile, event.data, (err) => {
    if (err) {
      console.log(err);
    }
    return context.succeed(true);
  });
};
