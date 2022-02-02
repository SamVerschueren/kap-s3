'use strict';
const fs = require('fs');
const path = require('path');
const url = require('url');
const AWS = require('aws-sdk');

const contentTypes = new Map([
	['.gif', 'image/gif'],
	['.mp4', 'video/mp4'],
	['.webm', 'video/webm'],
	['.apng', 'image/apng']
]);

const action = async context => {
	const filePath = await context.filePath();

	context.setProgress('Uploading…');

	const custom_endpoint = new AWS.Endpoint(context.config.get('endpoint'))

	const s3 = new AWS.S3({
		region: context.config.get('region'),
		accessKeyId: context.config.get('accessKeyId'),
		secretAccessKey: context.config.get('secretAccessKey'),
		endpoint: custom_endpoint,
		s3ForcePathStyle: context.config.get('pathStyle')
	});

	const split = context.config.get('path').split('/');
	const bucket = split.shift();
	const filename = path.basename(filePath);
	const objectKey = path.join(split.join('/'), filename);
	const extension = path.extname(filename);
	const contentType = contentTypes.get(extension) || 'application/octet-stream';

	const upload = s3.upload({
		Bucket: bucket,
		Key: path.join(split.join('/'), filename),
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
		endpoint: {
			title: 'S3 Endpoint',
			type: 'string',
			default: '',
			required: false
		},
		pathStyle: {
			title: 'Use path style URLs',
			type: 'boolean',
			default: 'false',
			required: false
		},
		baseURL: {
			title: 'Base URL',
			type: 'string',
			require: false
		}
	}
};

exports.shareServices = [s3];