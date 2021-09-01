const BASEURL = "https://tools.spypro.io/public";
import request from "request";
import got from 'got';
import aws from 'aws-sdk';



// const BUCKET_NAME = "vitaminspy1";
// const REGION = "nyc3.digitaloceanspaces.com";
// const CDN = "https://photos.vitaminspy.com/";

const BUCKET_NAME = "vitaminspy2";
const REGION = "sgp1.digitaloceanspaces.com";
const CDN = "https://photos2.vitaminspy.com/"

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new aws.Endpoint(REGION);
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
});

export const upfile = async (fileContent) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET_NAME,
      ContentType: "image/jpeg",
      Key: `photos/facebook/${uniqueSuffix}`,
      Body: fileContent,
      ACL: "public-read",
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        console.log(err)
        reject(err);
      }
      console.log(CDN +data?.key)
      resolve(CDN +data?.key);
    });
  });
};
