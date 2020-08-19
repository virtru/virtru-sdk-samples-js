# Virtru SDK Secure Form and File Submission
Example HTML Form and JavaScript that will create 2 TDFs and upload to S3.  


## Prerequisites
* [S3 Cognito credentials](console.aws.amazon.com/cognito)
* [S3 Bucket](https://s3.console.aws.amazon.com/s3)
* Cognito credentials must have "appropriate" rights to the S3 Bucket
    * s3:PutObject
    * s3:GetObjectAcl
    * s3:GetObject
    * s3:DeleteObject
    * s3:PutObjectAcl

## To Run locally
* Visual Studio Code [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare)
* Start a Web Server Locally - [Local Dev Server](https://www.npmjs.com/package/dev-web-server)

## Install Local Dev Server
```
cd virtru-sdk-js-upload-form
npm install -g dev-web-server
dev-web-server
```
## Usage
[http://localhost:8080](http://localhost:8080)


## Uninstall Local Dev Server
```
npm uninstall -g dev-web-server
```


## S3 Authentictaion
This example uses the standard [S3 Cognito configuration](https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-user-pool.html) to access the S3 bucket for upload.  


## Demo
This will:
* Create a JSON file of the Text Fields
* Encrypt the JSON using the Virtru SDK client-side
* Encrypt the file in the file input filed using the Virtru SDK


```
# clone the repository
$ git clone http://github.com/virtru/virtru-sdk-js-samples.git

# change directory
$ cd virtru-sdk-js-samples/virtru-sdk-js-webform

# Add Keys
# open js/aws_s3.js 
# -update "BucketName"
# -update "BucketRegion"
# -update "IdentityPoolId"

# Add Form Owner Email Address
# open index.html
# -update "formOwner"

# Run Example
# Visit web form on host
```

