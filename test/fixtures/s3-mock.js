'use strict';
const AWS = require('aws-sdk');

class S3 {
	upload(params) {
		return {
			on: (event, cb) => { },
			promise: () => Promise.resolve({
				Location: `https://s3-${this._options.region}.amazonaws.com/${params.Bucket}/${params.Key}`
			})
		}
	}
};

const s3 = new S3();

AWS.S3 = function (options) {
	s3._options = options;
	return s3;
};

module.exports = s3;
