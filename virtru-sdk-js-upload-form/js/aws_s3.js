
var BucketName = "virtru-sdk-form";
var BucketRegion = "us-east-2";
var IdentityPoolId = "us-east-2:b053f577-c015-4520-a7d9-aa19071f3d87";

AWS.config.update({
  region: BucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: BucketName }
});

// stream 
function uploadFile(ctString, tdfFilename) {
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: BucketName,
      Key: tdfFilename,
      Body: ctString
    }
  });

  var promise = upload.promise();

  promise.then(
    function(data) {
      console.log("Successfully uploaded: " + tdfFilename);
    },
    function(err) {
      console.log("There was an error uploading: " + tdfFilename, err.message);
    }
  );
}
