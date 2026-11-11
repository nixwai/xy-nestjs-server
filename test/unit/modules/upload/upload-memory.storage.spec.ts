import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  RequestBoundedMemoryStorage,
  BoundedMemoryStorage,
  UPLOAD_MEMORY_BUDGET
} from '#/modules/upload/storage/bounded-memory.storage.js';

function request() {
  return Object.assign(new EventEmitter(), {
    res: new EventEmitter(),
    files: [] as Express.Multer.File[]
  }) as unknown as Request;
}
function file(): Express.Multer.File & { stream: PassThrough } {
  return {
    fieldname: 'files',
    originalname: 'image.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 0,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.alloc(0),
    stream: new PassThrough()
  };
}
function receive(storage: RequestBoundedMemoryStorage, req: Request, bytes: number) {
  const input = file();
  const completed = new Promise<Partial<Express.Multer.File>>((resolve, reject) =>
    storage._handleFile(req, input, (error, info) => (error ? reject(error) : resolve(info ?? {})))
  );
  input.stream.end(Buffer.alloc(bytes));
  return { input, completed };
}
describe('通用上传按请求隔离聚合内存预算', () => {
  it('统一默认64MiB预算', () => {
    expect(new BoundedMemoryStorage()).toBeInstanceOf(BoundedMemoryStorage);
    expect(UPLOAD_MEMORY_BUDGET).toBe(64 * 1024 * 1024);
  });
  it('跨文件累计，超限释放已接收文件，其他请求不受影响', async () => {
    const storage = new RequestBoundedMemoryStorage(4);
    const firstRequest = request();
    const first = receive(storage, firstRequest, 3);
    const info = await first.completed;
    const uploaded = { ...first.input, ...info };
    firstRequest.files = [uploaded];
    await expect(receive(storage, firstRequest, 2).completed).rejects.toThrow('本次上传文件总大小不能超过 4 字节');
    expect(first.input.buffer).toBeUndefined();
    expect(uploaded.buffer).toBeUndefined();
    await expect(receive(storage, request(), 4).completed).resolves.toMatchObject({ size: 4 });
  });
  it('两个同时请求独立计数，响应完成或关闭释放已接收buffer', async () => {
    const storage = new RequestBoundedMemoryStorage(4);
    const requests = [request(), request()];
    const files = requests.map(req => receive(storage, req, 4));
    await Promise.all(files.map(x => x.completed));
    expect(files.every(x => x.input.buffer?.length === 4)).toBe(true);
    requests[0].res?.emit('finish');
    requests[1].res?.emit('close');
    expect(files.every(x => x.input.buffer === undefined)).toBe(true);
  });
  it('请求中断使未完成文件失败，且回调只调用一次', async () => {
    const storage = new RequestBoundedMemoryStorage(4);
    const req = request();
    const input = file();
    const callback = vi.fn();
    storage._handleFile(req, input, callback);
    input.stream.write(Buffer.alloc(2));
    req.emit('aborted');
    input.stream.end();
    await new Promise(resolve => setImmediate(resolve));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
    expect(input.buffer).toBeUndefined();
  });
  it('删除文件释放其占用额度', async () => {
    const storage = new RequestBoundedMemoryStorage(4);
    const req = request();
    const received = receive(storage, req, 4);
    await received.completed;
    const callback = vi.fn();
    storage._removeFile(req, received.input, callback);
    expect(callback).toHaveBeenCalledWith(null);
    await expect(receive(storage, req, 4).completed).resolves.toMatchObject({ size: 4 });
  });
});

it('单文件路由req.file的Multer副本也在响应结束释放', async () => {
  const storage = new RequestBoundedMemoryStorage(4);
  const req = request();
  const received = receive(storage, req, 4);
  const info = await received.completed;
  req.file = { ...received.input, ...info };
  req.res?.emit('finish');
  expect(req.file.buffer).toBeUndefined();
});
