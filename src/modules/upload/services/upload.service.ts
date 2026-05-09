import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UploadResult } from '../interfaces';

const ALLOWED_MIMES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
];

const ALLOWED_EXTENSIONS: string[] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'svg',
  'pdf',
  'mp4',
  'mov',
];

const IMAGE_MIMES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const UPLOAD_FOLDER = 'influence_gate';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_FILES = 10;

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadMany(files: Express.Multer.File[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('يجب إرفاق ملف واحد على الأقل');
    }
    if (files.length > MAX_BATCH_FILES) {
      throw new BadRequestException(
        `الحد الأقصى للملفات المسموح برفعها هو ${MAX_BATCH_FILES} ملفات`,
      );
    }
    return Promise.all(files.map((file) => this.upload(file)));
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    this.validateFileSize(file);
    this.validateMimeType(file);
    await this.validateMagicBytes(file);

    const isImage = IMAGE_MIMES.includes(file.mimetype);
    const result = isImage
      ? await this.cloudinaryService.uploadImage(file, UPLOAD_FOLDER)
      : await this.cloudinaryService.uploadFile(file, UPLOAD_FOLDER);

    return {
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
    };
  }

  private validateFileSize(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح به (50MB)');
    }
  }

  private validateMimeType(file: Express.Multer.File): void {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `نوع الملف غير مدعوم. الأنواع المسموح بها: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }

  private async validateMagicBytes(file: Express.Multer.File): Promise<void> {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<typeof import('file-type')>;
    const { fileTypeFromBuffer } = await dynamicImport('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected) {
      if (file.mimetype === 'image/svg+xml') {
        return;
      }
      throw new BadRequestException('تعذّر التحقق من نوع الملف');
    }

    if (!ALLOWED_EXTENSIONS.includes(detected.ext)) {
      throw new BadRequestException(
        `محتوى الملف لا يطابق نوعه المعلَن. الأنواع المسموح بها: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }
}
