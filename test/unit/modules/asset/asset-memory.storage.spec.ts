import { PassThrough } from 'node:stream';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { BoundedMemoryStorage, UPLOAD_MEMORY_BUDGET } from '#/modules/upload/storage/bounded-memory.storage.js';

/** 构造只包含内存存储所需字段的上传文件。 */
function file() {
  return {
    fieldname: 'files',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 0,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.alloc(0),
    originalname: 'a.png',
    stream: new PassThrough()
  } as Express.Multer.File;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
describe('素材聚合内存存储', () => {
  it('默认总预算明确为 64 MiB', () => {
    expect(UPLOAD_MEMORY_BUDGET).toBe(64 * 1024 * 1024);
    expect(new BoundedMemoryStorage()).toBeInstanceOf(BoundedMemoryStorage);
  });
  it('允许总大小恰好等于预算并返回完整 buffer，移除时释放引用', async () => {
    const storage = new BoundedMemoryStorage(4);
    const upload = file();
    const callback = vi.fn();
    storage._handleFile({} as Request, upload, callback);
    (upload.stream as PassThrough).end(Buffer.from('1234'));
    await tick();
    expect(callback).toHaveBeenCalledWith(null, { buffer: Buffer.from('1234'), size: 4 });
    const remove = vi.fn();
    storage._removeFile({} as Request, upload, remove);
    expect(upload).not.toHaveProperty('buffer');
    expect(remove).toHaveBeenCalledWith(null);
    storage._removeFile({} as Request, upload, remove);
    expect(remove).toHaveBeenCalledTimes(2);
  });
  it('预算跨文件累计，超限释放已完成文件并拒绝后续文件', async () => {
    const storage = new BoundedMemoryStorage(4);
    const first = file();
    const callback = vi.fn();
    const req = { files: [] } as unknown as Request;
    storage._handleFile(req, first, callback);
    (first.stream as PassThrough).end(Buffer.from('123'));
    await tick();
    const publicFile = { ...first };
    req.files = [publicFile];
    const second = file();
    const failed = vi.fn();
    storage._handleFile(req, second, failed);
    second.stream.emit('data', Buffer.from('45'));
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ message: '本次上传文件总大小不能超过 4 字节' }));
    expect(first).not.toHaveProperty('buffer');
    expect(publicFile).not.toHaveProperty('buffer');
    const rejected = vi.fn();
    storage._handleFile(req, file(), rejected);
    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({ message: '本次上传文件总大小不能超过 4 字节' }));
    second.stream.emit('data', Buffer.from('6'));
    second.stream.emit('end');
    second.stream.emit('error', new Error('late error'));
    expect(failed).toHaveBeenCalledTimes(1);
  });
  it('多个活动文件共享预算，错误后每个回调只完成一次', () => {
    const storage = new BoundedMemoryStorage(4);
    const a = file();
    const b = file();
    const ca = vi.fn();
    const cb = vi.fn();
    storage._handleFile({} as Request, a, ca);
    storage._handleFile({} as Request, b, cb);
    a.stream.emit('data', Buffer.from('123'));
    b.stream.emit('data', Buffer.from('45'));
    expect(ca).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(1);
    a.stream.emit('end');
    b.stream.emit('end');
    expect(ca).toHaveBeenCalledTimes(1);
  });
  it('流错误传播并释放内存；字典型 req.files 同样清理', () => {
    const storage = new BoundedMemoryStorage(4);
    const upload = file();
    const req = { files: { files: [Object.assign(file(), { buffer: Buffer.from('x') })] } } as unknown as Request;
    const callback = vi.fn();
    storage._handleFile(req, upload, callback);
    upload.stream.emit('data', Buffer.from('12'));
    const error = new Error('stream failure');
    upload.stream.emit('error', error);
    expect(callback).toHaveBeenCalledWith(error);
    expect((req.files as Record<string, Express.Multer.File[]>).files[0]).not.toHaveProperty('buffer');
    storage.dispose();
  });
});
