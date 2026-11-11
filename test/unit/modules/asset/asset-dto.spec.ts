import type { ClassConstructor } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  AssetImageQueryDto,
  BatchAssetUploadDto,
  CreateAssetFolderDto,
  MoveAssetImageDto
} from '#/modules/asset/dto/index.js';

const options = { whitelist: true, forbidNonWhitelisted: true };
describe('素材请求 DTO', () => {
  it.each(['0', '-1', '1.5', ' 1', '01', 'abc', 1, null])('拒绝非法 ownerId %s', ownerId => {
    expect(validateSync(plainToInstance(CreateAssetFolderDto, { name: '图片', ownerId }), options)).not.toHaveLength(0);
  });
  it('接受 bigint 字符串且不转换为 number', () => {
    expect(
      validateSync(plainToInstance(CreateAssetFolderDto, { name: '图片', ownerId: '9007199254740993' }), options)
    ).toHaveLength(0);
  });
  it.each<ClassConstructor<object>>([CreateAssetFolderDto, BatchAssetUploadDto, MoveAssetImageDto])(
    '拒绝客户端 createdByAdminId',
    Dto => {
      expect(validateSync(plainToInstance(Dto, { createdByAdminId: '2' }), options)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'createdByAdminId',
            constraints: { whitelistValidation: expect.any(String) }
          })
        ])
      );
    }
  );
  it.each([
    ['true', true],
    ['false', false],
    [true, true],
    [false, false]
  ])('严格转换 unclassified %s', (value, expected) => {
    const dto = plainToInstance(AssetImageQueryDto, { unclassified: value });
    expect(validateSync(dto, options)).toHaveLength(0);
    expect(dto).toHaveProperty('unclassified', expected);
  });
  it.each(['1', '0', '', 'TRUE', ['true']])('拒绝非法布尔值 %s', unclassified => {
    expect(validateSync(plainToInstance(AssetImageQueryDto, { unclassified }), options)).not.toHaveLength(0);
  });
  it('未分类与 folderId 不可同时指定', () => {
    expect(
      validateSync(plainToInstance(AssetImageQueryDto, { unclassified: 'true', folderId: '1' }), options)
    ).not.toHaveLength(0);
  });
  it('multipart body 接受 ownerId 和 folderId', () => {
    expect(validateSync(plainToInstance(BatchAssetUploadDto, { ownerId: '2', folderId: '1' }), options)).toHaveLength(
      0
    );
  });
});
