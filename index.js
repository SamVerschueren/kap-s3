'use strict';
const fs = require('fs');
const path = require('path');
const url = require('url');
const AWS = require('aws-sdk');

const action = async context => {
	const filePath = await context.filePath();

	context.setProgress('Uploading…');

	const s3 = new AWS.S3({
		region: context.config.get('region'),
		accessKeyId: context.config.get('accessKeyId'),
		secretAccessKey: context.config.get('secretAccessKey')
	});

	const split = context.config.get('path').split('/');
	const bucket = split.shift();
	const filename = path.basename(filePath);
	const extension = path.extname(filename);
	const objectKey = path.join(split.join('/'), filename);

	let contentType = 'application/octet-stream';
	switch (extension) {
		case '.gif':
			contentType = 'image/gif';
			break;
		case '.mp4':
			contentType = 'video/mp4';
			break;
		case '.webm':
			contentType = 'video/webm';
			break;
		case '.apng':
			contentType = 'image/apng';
			break;
		default:
			contentType = 'application/octet-stream';
			break;
	}

	const upload = s3.upload({
		Bucket: bucket,
		Key: objectKey,
		Body: fs.createReadStream(filePath),
		ContentType: contentType
	});

	upload.on('httpUploadProgress', progress => {
		const percentage = progress.loaded / progress.total;
		context.setProgress('Uploading…', percentage);
	});

	const response = await upload.promise();
	let uploadURL = response.Location;

	const baseURL = context.config.get('baseURL');
	if (baseURL) {
		uploadURL = url.resolve(baseURL, objectKey);
	}

	context.copyToClipboard(uploadURL);
	context.notify('S3 URL copied to the clipboard');
};

const s3 = {
	title: 'Share to S3',
	formats: ['gif', 'mp4', 'webm', 'apng'],
	action,
	config: {
		region: {
			title: 'Region',
			type: 'string',
			default: 'us-west-1',
			required: true
		},
		accessKeyId: {
			title: 'Access Key',
			type: 'string',
			default: '',
			required: true
		},
		secretAccessKey: {
			title: 'Secret Access Key',
			type: 'string',
			default: '',
			required: true
		},
		path: {
			title: 'S3 Path',
			type: 'string',
			default: '',
			required: true
		},
		baseURL: {
			title: 'Base URL',
			type: 'string',
			require: false
		}
	}
};

exports.shareServices = [s3];
