import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import type { StorageEngine } from 'multer';

/** 单请求所有文件共享的内存预算，不改变配置的文件数量或单文件大小。 */
export const UPLOAD_MEMORY_BUDGET = 64 * 1024 * 1024;

type FileCallback = (error?: Error | null, info?: Partial<Express.Multer.File>) => void;
interface PendingFile {
  file: Express.Multer.File;
  chunks: Buffer[];
  size: number;
  callback: FileCallback;
  completed: boolean;
}

/** 仅保存在内存；超预算立即中止并释放本请求已持有的所有文件内容。 */
export class BoundedMemoryStorage implements StorageEngine {
  private readonly entries = new Set<PendingFile>();
  private retainedBytes = 0;
  private failure: Error | undefined;
  private request: Request | undefined;

  constructor(private readonly budget = UPLOAD_MEMORY_BUDGET) {}

  _handleFile(request: Request, file: Express.Multer.File, callback: FileCallback): void {
    this.request = request;
    if (this.failure) {
      callback(this.failure);
      return;
    }
    const entry: PendingFile = { file, chunks: [], size: 0, callback, completed: false };
    this.entries.add(entry);
    file.stream.on('data', (chunk: Buffer) => {
      if (this.failure) return;
      if (this.retainedBytes + chunk.length > this.budget) {
        this.abort(new BadRequestException(`本次上传文件总大小不能超过 ${this.budget} 字节`));
        return;
      }
      this.retainedBytes += chunk.length;
      entry.size += chunk.length;
      entry.chunks.push(chunk);
    });
    file.stream.once('error', (error: Error) => this.abort(error));
    file.stream.once('end', () => {
      if (this.failure) return;
      const buffer = Buffer.concat(entry.chunks, entry.size);
      entry.chunks = [];
      entry.completed = true;
      // 同时记录在原始文件上，确保后续文件失败时能够释放成功文件的引用。
      file.buffer = buffer;
      callback(null, { buffer, size: entry.size });
    });
  }

  _removeFile(_request: Request, file: Express.Multer.File, callback: (error: Error | null) => void): void {
    for (const entry of this.entries) {
      if (entry.file !== file) continue;
      this.retainedBytes -= entry.size;
      entry.chunks = [];
      this.entries.delete(entry);
      break;
    }
    Reflect.deleteProperty(file, 'buffer');
    callback(null);
  }

  /** 请求结束或解析失败时清除所有本请求内容。 */
  dispose(): void {
    if (this.request?.file) Reflect.deleteProperty(this.request.file, 'buffer');
    const files = this.request?.files;
    const uploaded = Array.isArray(files) ? files : Object.values(files ?? {}).flat();
    for (const file of uploaded) Reflect.deleteProperty(file, 'buffer');
    for (const entry of this.entries) {
      entry.chunks = [];
      Reflect.deleteProperty(entry.file, 'buffer');
    }
    this.entries.clear();
    this.retainedBytes = 0;
  }

  abortRequest(): void {
    this.abort(new BadRequestException('上传请求已中断'));
  }

  private abort(error: Error): void {
    if (this.failure) return;
    this.failure = error;
    const pending = [...this.entries].filter(entry => !entry.completed);
    this.dispose();
    for (const entry of pending) {
      entry.completed = true;
      entry.callback(error);
    }
  }
}

/** Multer模块共享适配器；每个请求创建独立预算，禁止跨请求累计或持有buffer。 */
export class RequestBoundedMemoryStorage implements StorageEngine {
  private readonly requests = new WeakMap<Request, BoundedMemoryStorage>();
  constructor(private readonly budget = UPLOAD_MEMORY_BUDGET) {}

  _handleFile(request: Request, file: Express.Multer.File, callback: FileCallback): void {
    this.forRequest(request)._handleFile(request, file, callback);
  }

  _removeFile(request: Request, file: Express.Multer.File, callback: (error: Error | null) => void): void {
    const storage = this.requests.get(request);
    if (storage) storage._removeFile(request, file, callback);
    else {
      Reflect.deleteProperty(file, 'buffer');
      callback(null);
    }
  }

  private forRequest(request: Request): BoundedMemoryStorage {
    const existing = this.requests.get(request);
    if (existing) return existing;
    const storage = new BoundedMemoryStorage(this.budget);
    this.requests.set(request, storage);
    const cleanup = () => {
      storage.dispose();
      this.requests.delete(request);
      request.off('aborted', aborted);
      request.res?.off('finish', cleanup);
      request.res?.off('close', cleanup);
    };
    const aborted = () => {
      storage.abortRequest();
      cleanup();
    };
    request.once('aborted', aborted);
    request.res?.once('finish', cleanup);
    request.res?.once('close', cleanup);
    return storage;
  }
}
