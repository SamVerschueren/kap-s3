import test from 'ava';
import sinon from 'sinon';
import pluginTest from 'kap-plugin-test';
import s3 from './fixtures/s3-mock';

const file = 'test/fixtures/unicorn.gif';
const config = {
	region: 'eu-west-1',
	accessKeyId: 'foo',
	secretAccessKey: 'bar',
	path: 'bucket/folder'
};

sinon.spy(s3, 'upload');

test('s3 upload parameters are correct', async t => {
	const plugin = pluginTest(file, {config});

	await plugin.run();

	const s3UploadParams = s3.upload.lastCall.args[0];

	t.is(s3UploadParams.Bucket, 'bucket');
	t.is(s3UploadParams.Key, 'folder/unicorn.gif');
	t.is(s3UploadParams.ContentType, 'image/gif');
});

test('copies url to clipboard', async t => {
	const plugin = pluginTest(file, {config});

	await plugin.run();

	t.true(plugin.context.copyToClipboard.calledWith('https://s3-eu-west-1.amazonaws.com/bucket/folder/unicorn.gif'));
});

test('uses baseURL config correctly', async t => {
	const testConfig = {config};
	testConfig.config.baseURL = 'https://mydomain.com/';
	const plugin = pluginTest(file, testConfig);

	await plugin.run();

	t.true(plugin.context.copyToClipboard.calledWith('https://mydomain.com/folder/unicorn.gif'));
});
