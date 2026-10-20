import { UserRole, OrderStatus, MONOREPO_INFO } from '@web-manager/shared';
import fs from 'fs';
import path from 'path';

describe('Mission 04: Monorepo & Structure Tests', () => {
  test('pnpm-workspace.yaml should exist and configure apps/* and packages/*', () => {
    const workspacePath = path.resolve(__dirname, '../../../pnpm-workspace.yaml');
    expect(fs.existsSync(workspacePath)).toBe(true);

    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain("apps/*");
    expect(content).toContain("packages/*");
  });

  test('Root package.json should define workspaces and core scripts', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(pkg.name).toBe('web-manager-monorepo');
    expect(pkg.scripts).toHaveProperty('dev');
    expect(pkg.scripts).toHaveProperty('build');
    expect(pkg.scripts).toHaveProperty('test');
  });

  test('@web-manager/shared should export core domain enums and constants', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.MANAGER).toBe('MANAGER');
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');

    expect(OrderStatus.PENDING).toBe('PENDING');
    expect(OrderStatus.PAID).toBe('PAID');
    expect(OrderStatus.SHIPPED).toBe('SHIPPED');
    expect(OrderStatus.CANCELLED).toBe('CANCELLED');

    expect(MONOREPO_INFO.apps).toContain('apps/api');
    expect(MONOREPO_INFO.packages).toContain('packages/shared');
  });
});
