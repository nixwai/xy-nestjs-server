import { DocumentBuilder } from '@nestjs/swagger';
/** 创建当前服务使用的 OpenAPI 基础配置。 */
export function createSwaggerConfig(globalPrefix = 'api') {
  return new DocumentBuilder()
    .setTitle('景区导游预约平台 API')
    .setDescription(
      [
        '面向微信小程序和管理后台的 REST API。',
        '',
        '调用说明：',
        '1. 需要登录的接口使用 Bearer Token，在 Authorize 中填入 accessToken。',
        '2. HTTP 200 只表示请求已被服务处理，业务结果通过响应体 code 判断。',
        '3. 成功响应格式为 { code: 0, message: "success", data }。',
        '4. 业务错误响应格式为 { code, message, data: null }。'
      ].join('\n')
    )
    .setVersion('1.0.0')
    .addServer(`/${globalPrefix}`, '当前环境 API 根路径')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '填写登录接口返回的 accessToken，不需要填写 Bearer 前缀。'
      },
      'bearer'
    )
    .addTag('健康检查', '服务存活和依赖就绪检查')
    .addTag('认证', '管理员登录、令牌刷新和会话注销')
    .addTag('管理员管理', '管理员账户及角色绑定管理')
    .addTag('角色管理', '角色及角色权限绑定管理')
    .addTag('权限管理', '系统权限目录及启停管理')
    .addTag('审计', '管理员和权限变更审计查询')
    .build();
}
