'use strict';

const im = require('imagemagick');
const s3 = require('../lib/s3.js');
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
  console.log("data is:");
  console.log(event.data);
  const bucket = event.outputBucket ? event.outputBucket : config.s3.bucket;
  // // load image
  console.log('writing %s/%s', bucket, event.outputFile);
  const files = new s3(bucket);
  console.log("created s3 interfrace");
  const binaryData = new Buffer(event.data.base64, 'base64');
  files.writeObject(event.outputFile, binaryData, (err) => {
    if (err) {
      console.log(err);
    }
    return context.succeed(true);
  });
};
