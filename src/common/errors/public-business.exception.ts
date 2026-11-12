import { BadRequestException } from '@nestjs/common';
import { HttpCode } from '../enums/index.js';

/**
 * 携带可公开安全明细的客户端业务异常，固定使用 HTTP 400 与 BAD_REQUEST 业务码。
 * 子类必须在构造前显式选择、脱敏并冻结嵌套字段；不得传入原始记录或外部异常对象。
 */
export abstract class PublicBusinessException<T extends object> extends BadRequestException {
  readonly #publicDetails: Readonly<T>;

  protected constructor(message: string, safeDetails: T) {
    super(message);
    this.#publicDetails = Object.freeze(safeDetails);
  }

  /** 不允许调用方指定成功码、服务端错误码或任意状态码。 */
  get code(): HttpCode.BAD_REQUEST {
    return HttpCode.BAD_REQUEST;
  }

  /** 唯一归一化明细，供业务测试和调用方读取。 */
  get details(): Readonly<T> {
    return this.#publicDetails;
  }

  /** 公开响应与内部明细共享同一真源，不做第二次映射。 */
  get data(): Readonly<T> {
    return this.#publicDetails;
  }
}
