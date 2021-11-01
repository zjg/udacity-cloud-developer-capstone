import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

export class AttachmentUtils {
    constructor(
        private readonly s3Client = createS3Client(),
        private readonly bucketName: string = process.env.ATTACHMENT_S3_BUCKET,
        private readonly expirationTime: number = +process.env.SIGNED_URL_EXPIRATION,
    ) {}

    async getPresignedUrl(todoId: string) : Promise<string> {
        return this.s3Client.getSignedUrlPromise(
            'putObject',
            {
                Bucket: this.bucketName,
                Key: todoId,
                Expires: this.expirationTime,
            }
        )
    }

}

function createS3Client() {
    const params = {
        signatureVersion: 'v4'
    }
    if (process.env._X_AMZN_TRACE_ID) {
        const XAWS = AWSXRay.captureAWS(AWS)
        return new XAWS.S3(params)
    } else {
        return new AWS.S3(params);
    }
}