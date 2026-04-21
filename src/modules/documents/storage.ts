import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AppEnv } from "../../config/env";

export interface UploadResult {
  key: string;
  originalName: string;
}

export interface ObjectStorage {
  upload(file: Express.Multer.File): Promise<UploadResult>;
}

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly env: AppEnv) {
    this.client = new S3Client({
      region: env.AWS_REGION
    });
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const key = `documents/${randomUUID()}-${file.originalname}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
    return { key, originalName: file.originalname };
  }
}

export class LocalDevStorage implements ObjectStorage {
  async upload(file: Express.Multer.File): Promise<UploadResult> {
    return {
      key: `local-dev/${randomUUID()}-${file.originalname}`,
      originalName: file.originalname
    };
  }
}
