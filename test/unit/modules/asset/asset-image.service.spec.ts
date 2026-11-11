import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssetImageService } from '#/modules/asset/asset-image.service.js';
import { AssetImageQueryDto } from '#/modules/asset/dto/index.js';

function setup() {
  const image = { id: '10', ownerId: '2', createdByAdminId: '1', folderId: null };
  const folders = { lockOwner: vi.fn(), findById: vi.fn(async () => ({ id: '20', ownerId: '2' })) };
  const images = {
    findById: vi.fn(async () => image),
    create: vi.fn(async x => ({ ...x, id: '11' })),
    updateFolder: vi.fn(async (_id, folderId) => ({ ...image, folderId })),
    softDelete: vi.fn(),
    list: vi.fn(async () => ({ items: [], total: 0 }))
  };
  const policy = {
    assertManage: vi.fn(),
    assertOwnerExists: vi.fn(),
    assertFolderReadable: vi.fn(),
    queryScope: vi.fn(async () => ({ kind: 'owner', ownerId: '2' }))
  };
  const upload = {
    validateBatch: vi.fn(),
    uploadImage: vi.fn(async () => ({
      storageKey: 'key',
      url: '/a.jpg',
      mimeType: 'image/jpeg',
      size: 50,
      width: 4,
      height: 5
    })),
    deleteObject: vi.fn()
  };
  const tx = { run: vi.fn(async work => work({ folders, images })) };
  const service = new AssetImageService(images as never, tx as never, policy as never, upload as never);
  return { service, folders, images, policy, upload };
}
const file = (name = 'a.png') =>
  ({ originalname: name, mimetype: 'image/png', size: 100, buffer: Buffer.from('input') }) as never;
describe('AssetImageService', () => {
  it('saves processed metadata, actual actor and target owner', async () => {
    const { service, images } = setup();
    const result = await service.upload('1', [file()], '20', '2');
    expect(images.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: '2',
        createdByAdminId: '1',
        mimeType: 'image/jpeg',
        size: 50,
        width: 4,
        height: 5
      })
    );
    expect(result.success[0].originalName).toBe('a.png');
  });
  it('cleans OSS after DB failure and never leaks raw failure messages', async () => {
    const { service, images, upload } = setup();
    images.create
      .mockRejectedValueOnce(new Error('SQL secret'))
      .mockImplementationOnce(async x => ({ ...x, id: '12' }));
    const result = await service.upload('1', [file('bad.png'), file('good.png')], null, '2');
    expect(upload.deleteObject).toHaveBeenCalledWith('key');
    expect(result.failed).toEqual([{ filename: 'bad.png', reason: '素材保存失败，请稍后重试' }]);
    expect(result.success[0].originalName).toBe('good.png');
  });
  it('reports all failures with safe details', async () => {
    const { service, upload } = setup();
    upload.uploadImage.mockRejectedValue(new Error('SQL secret'));
    await expect(service.upload('1', [file()], null, '2')).rejects.toMatchObject({
      details: { successCount: 0, failed: [{ filename: 'a.png', reason: '图片上传失败，请稍后重试' }] }
    });
  });
  it('refuses mismatching folder owner before upload', async () => {
    const { service, folders, upload } = setup();
    folders.findById.mockResolvedValue({ id: '20', ownerId: '3' });
    await expect(service.upload('1', [file()], '20', '2')).rejects.toBeInstanceOf(ForbiddenException);
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  it('rechecks folder after upload and compensates if deleted meanwhile', async () => {
    const { service, folders, upload } = setup();
    folders.findById.mockResolvedValueOnce({ id: '20', ownerId: '2' }).mockResolvedValue(null as never);
    await expect(service.upload('1', [file()], '20', '2')).rejects.toBeInstanceOf(BadRequestException);
    expect(upload.deleteObject).toHaveBeenCalled();
  });
  it('rejects ambiguous folder queries and supports unclassified explicitly', async () => {
    const { service, images } = setup();
    const query = Object.assign(new AssetImageQueryDto(), { ownerId: '2', unclassified: true, folderId: '20' });
    await expect(service.list('1', query)).rejects.toBeInstanceOf(BadRequestException);
    query.folderId = undefined as never;
    await service.list('1', query);
    expect(images.list).toHaveBeenCalledWith(
      expect.objectContaining({ scope: { kind: 'owner', ownerId: '2' }, unclassified: true })
    );
  });
  it('moves own-target images under the owner lock without changing identity', async () => {
    const { service, folders, images } = setup();
    await service.move('1', '10', '20', '2');
    expect(folders.lockOwner).toHaveBeenCalledWith('2');
    expect(images.updateFolder).toHaveBeenCalledWith('10', '20');
  });
  it('rejects missing and foreign image records', async () => {
    const a = setup();
    a.images.findById.mockResolvedValue(null as never);
    await expect(a.service.delete('1', '10', '2')).rejects.toBeInstanceOf(NotFoundException);
    const b = setup();
    await expect(b.service.delete('1', '10', '3')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('deletes only the database record', async () => {
    const { service, images, upload } = setup();
    await service.delete('1', '10', '2');
    expect(images.softDelete).toHaveBeenCalledWith('10');
    expect(upload.deleteObject).not.toHaveBeenCalled();
  });
  it('validates the entire batch before uploading', async () => {
    const { service, upload } = setup();
    upload.validateBatch.mockImplementation(() => {
      throw new BadRequestException('超过限制');
    });
    await expect(service.upload('1', [file()], null, '2')).rejects.toBeInstanceOf(BadRequestException);
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
});

describe('AssetImageService failure resilience', () => {
  it('returns failure even when OSS compensation itself fails', async () => {
    const { service, images, upload } = setup();
    images.create.mockRejectedValue(new Error('db'));
    upload.deleteObject.mockRejectedValue(new Error('oss'));
    await expect(service.upload('1', [file()], null, '2')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('never runs more than three uploads simultaneously and preserves file identity', async () => {
    const { service, upload } = setup();
    let running = 0;
    let max = 0;
    upload.uploadImage.mockImplementation(async () => {
      running += 1;
      max = Math.max(max, running);
      await new Promise(resolve => setTimeout(resolve, 5));
      running -= 1;
      return { storageKey: 'key', url: '/a.jpg', mimeType: 'image/jpeg', size: 50, width: 4, height: 5 };
    });
    const files = Array.from({ length: 8 }, (_, i) => file(`${i}.png`));
    const result = await service.upload('1', files, null, '2');
    expect(max).toBe(3);
    expect(result.success.map(x => x.originalName)).toEqual(Array.from({ length: 8 }, (_, i) => `${i}.png`));
  });
});

describe('AssetImageService safe client failures', () => {
  it('keeps known validation messages while masking arbitrary exception text', async () => {
    const { service, upload } = setup();
    upload.uploadImage.mockRejectedValueOnce(new BadRequestException('图片处理失败，请检查文件格式'));
    await expect(service.upload('1', [file()], null, '2')).rejects.toMatchObject({
      details: { failed: [{ filename: 'a.png', reason: '图片处理失败，请检查文件格式' }] }
    });
    upload.uploadImage.mockRejectedValueOnce(new BadRequestException('SQL secret'));
    await expect(service.upload('1', [file()], null, '2')).rejects.toMatchObject({
      details: { failed: [{ filename: 'a.png', reason: '图片格式、大小、目录或操作权限不符合要求' }] }
    });
  });
});
