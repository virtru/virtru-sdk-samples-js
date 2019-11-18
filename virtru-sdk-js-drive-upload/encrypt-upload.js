const Virtru = require('virtru-sdk');
const fs = require('fs');
const {google} = require('googleapis');
const readline = require('readline');

// TODO: Assign the Drive folder ID to which you'll upload content.
var folderId = '';

// ***** Virtru Stuff *****

/*
 * Reads Virtru credentials from file.
 *
 * @return {array} [appId, email] Values of appId & email.
 */
function getCreds() {
  const appId = fs.readFileSync('.virtru/appId').toString().replace('\n', '');
  const email = fs.readFileSync('.virtru/emailAddress').toString().replace('\n', '');
  return [appId, email];
}

// Assign credentials to respective variables.
var creds = getCreds();
const appId = creds[0];
const email = creds[1];

// Generate the Virtru Client
const client = new Virtru.Client({email, appId});

/*
 * Main function to iterate through files in directory.
 *
 * Calls the 'encrypt' function on each file.
 *
 * @param {object} auth Drive Authorization object created
 *                      by 'authorize' function.
 */
function virtruStart(auth) {
  promises = fs.readdirSync('./encrypt-in/').filter(function(x) {
    return x !== '.DS_Store';
  }).map(filename => encrypt(filename, auth));


  Promise.all(promises).then(() =>
    console.log(`Encrypted & Uploaded:`));
}

/*
 * Encryption function.  Encrypts to HTML string
 * that is passed to Drive client to create new file
 * in Drive.
 *
 * @param {string} fileName Name of the file to encrypt.
 * @param {object} auth Drive Authorization object created
 *                      by 'authorize' function.
 */
async function encrypt(filename, auth){
  const encryptParams = new Virtru.EncryptParamsBuilder()
    .withFileSource(`./encrypt-in/${filename}`)
    .withDisplayFilename(filename)
    .build();
  ct = await client.encrypt(encryptParams);
  var ctString = await ct.toString();

  const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
    'name': `${filename}.tdf3.html`,
    parents: [folderId]
  };
  var media = {
    mimeType: 'text/html',
    body: ctString
  };
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      console.error(err);
      console.log(`${filename} - ERROR.`)
    } else {
      console.log(`- ${filename}`);
    }
  });
}

// ***** Google Auth Stuff *****
// Taken from sample here:
// "https://developers.google.com/drive/api/v3/quickstart/nodejs"

const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './.google/token.json';

// Load client secrets from a local file.
// ADDED:  Call 'virtruStart' function once secrets loaded.
fs.readFile('./.google/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), virtruStart);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
