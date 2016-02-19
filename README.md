##Install [Aws SDK](http://docs.aws.amazon.com/aws-sdk-php/v3/guide/getting-started/installation.html) in PW

[aws sdk docs](http://docs.aws.amazon.com/aws-sdk-php/v3/guide/getting-started/index.html)   

1. [unzip](http://docs.aws.amazon.com/aws-sdk-php/v3/download/aws.zip) in a folder called aws in your root project.
2. create template aws.php.
3. in your admin create a page called aws that uses this template.
4. Allow url segments
5. create a file called credentials under aws folder

```
[default]
aws_access_key_id = YOUR_AWS_ACCESS_KEY_ID
aws_secret_access_key = YOUR_AWS_SECRET_ACCESS_KEY

[project1]
aws_access_key_id = ANOTHER_AWS_ACCESS_KEY_ID
aws_secret_access_key = ANOTHER_AWS_SECRET_ACCESS_KEY
```

```php
<?php 
header('Access-Control-Allow-Origin: *');
include_once './aws/aws-autoloader.php';

$s3Client = new Aws\S3\S3Client([
    'version'     => 'latest',
    'region'      => 'eu-west-1',
    'credentials' => [
        'key'    => '*******',
        'secret' => '***********',
    ],
]);

$result = $s3Client->getObject([
    'Bucket' => 'mny-tmp',
    'Key'    => 'my-key'
]);

// // Print the body of the result by indexing into the result object.
echo $result['Body'];
?>
```


[presigned url](http://docs.aws.amazon.com/aws-sdk-php/v3/guide/service/s3-presigned-url.html)   
##[PHP S3 API](http://docs.aws.amazon.com/aws-sdk-php/v2/guide/service-s3.html)

