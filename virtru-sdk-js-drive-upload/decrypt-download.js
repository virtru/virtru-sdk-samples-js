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
 * Decryption function.  Includes logic to check if
 * file with same name exists and add count to filename.
 *
 * @param {string} uFileName Unique filename to ensure correct
 *                 keys used for files with same name.
 * @param {string} fileName Name of the file to decrypt.
 */
async function decrypt(uFileName, fileName){
  const decryptParams = new Virtru.DecryptParamsBuilder()
    .withFileSource(`/tmp/${uFileName}`)
    .build();
  const stream = await client.decrypt(decryptParams);

  var i = 1;
  var array = fileName.split('.');
  var decryptFileName = `${array[0]}.${array[1]}`;
  while (fs.existsSync(`./decrypt-out/${decryptFileName}`)) {
    decryptFileName = `${array[0]} (${i}).${array[1]}`;
    i++;
  }

  await stream.toFile(`./decrypt-out/${decryptFileName}`);
  console.log(`- ${decryptFileName}`);
}


/*
 * Main function to list and pull down files from specified
 * Drive folder.  First lists all `tdf3.html` files to obtain
 * file IDs, then pulls down content by ID and stores in ./tmp/.
 *
 * Passes filename to 'decrypt' function.
 *
 * Code block below based off combination of below examples:
 * function listFiles() @ https://developers.google.com/drive/api
 *                        /v3/quickstart/nodejs
 *
 * drive.files.get() @ https://developers.google.com/drive/api
 *                     /v3/manage-downloads
 *
 * @param {object} auth Drive Authorization object created
 *                      by 'authorize' function.
 */
function getFiles(auth) {
  console.log('Downloaded & Decrypted:')
  const drive = google.drive({
    version: 'v3',
    auth
  });
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
    q: `'${folderId}' in parents and name contains "tdf3.html" and trashed = false`
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    // Generate list of files.
    const files = res.data.files;
    if (files.length) {
      files.map((file) => {
        // Get name and ID of each file.
        var fileId = file.id;
        var fileName = file.name;
        // Assign a unique name (uFileName) to each file (fileName
        // + randnum)to ensure client will not attempt to use same
        //set of keys for multiple files of the same name.
        var uFileName = `${fileName}|${Math.random()}`;
        // Set temporary storage location in /tmp/
        var dest = fs.createWriteStream(`/tmp/${uFileName}`);
        drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, {
          responseType: 'stream'
        }, function (err, res) {
            res.data
            .on('end', () => {
              // Call decrypt function to operate on stream content
              // in /tmp/
              decrypt(uFileName, fileName);
            })
            .on('error', err => {
              console.log(`${fileName.replace('tdf3.html', '')} - Error: ${err}.`);
            })
            .pipe(dest);
        });
      });
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
// Call 'getFiles' function once secrets loaded.
fs.readFile('./.google/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), getFiles);
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
