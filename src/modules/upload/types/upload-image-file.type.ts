/** 内存模式 multipart 图片文件。 */
export interface UploadImageFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
