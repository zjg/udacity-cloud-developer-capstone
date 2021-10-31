import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class AttachmentUtils {
    constructor(
        private readonly s3Client = new XAWS.S3({
            signatureVersion: 'v4'
        }),
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