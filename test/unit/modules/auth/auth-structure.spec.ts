import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const sourceRoots = ['src', 'test', 'scripts'].map(directory => join(projectRoot, directory));

function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

describe('authentication module structure', () => {
  it('keeps identity and authorization concerns out of auth/shared', () => {
    expect(existsSync(join(projectRoot, 'src/modules/auth/shared/decorators'))).toBe(false);
    expect(existsSync(join(projectRoot, 'src/modules/auth/shared/guards'))).toBe(false);

    const sharedJwtTypes = readFileSync(join(projectRoot, 'src/modules/auth/shared/types/jwt.types.ts'), 'utf8');
    expect(sharedJwtTypes).not.toMatch(/AdminJwtPayload|UserJwtPayload/);
  });

  it('contains no legacy auth paths or duplicate admin role guard', () => {
    const forbidden = /auth[\\/]shared[\\/](decorators|guards)|AdminRoleGuard/;
    const violations = sourceRoots
      .flatMap(directory => collectFiles(directory))
      .filter(file => !file.endsWith('auth-structure.spec.ts'))
      .filter(file => forbidden.test(readFileSync(file, 'utf8')))
      .map(file => relative(projectRoot, file));

    expect(violations).toEqual([]);
  });
});
