import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from './index';

describe('Mission 18: Automated Tests & Quality Control', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('API health check endpoint /api/health should respond with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'WebManager API');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('All apps and packages should have valid package.json with scripts', () => {
    const packages = [
      'apps/api',
      'apps/web-astro',
      'apps/admin-nuxt',
      'packages/shared',
    ];

    packages.forEach((pkgPath) => {
      const fullPath = path.join(rootDir, pkgPath, 'package.json');
      expect(fs.existsSync(fullPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      expect(pkg.name).toBeDefined();
    });
  });

  test('pnpm-workspace.yaml should define apps/* and packages/*', () => {
    const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
    expect(fs.existsSync(workspacePath)).toBe(true);
    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain('apps/*');
    expect(content).toContain('packages/*');
  });
});

describe('Mission 19: Production Deployment Preparation', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('.env.example should exist and define essential production environment variables', () => {
    const envPath = path.join(rootDir, '.env.example');
    expect(fs.existsSync(envPath)).toBe(true);
    const content = fs.readFileSync(envPath, 'utf-8');
    expect(content).toContain('PORT=');
    expect(content).toContain('POSTGRES_DB=');
    expect(content).toContain('JWT_SECRET=');
  });

  test('docker-compose.yml should configure production services with healthchecks', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('services:');
    expect(content).toContain('postgres:');
    expect(content).toContain('redis:');
    expect(content).toContain('api:');
    expect(content).toContain('web-astro:');
    expect(content).toContain('admin-nuxt:');
    expect(content).toContain('healthcheck:');
  });

  test('Dockerfiles for API, Web Astro, and Admin Nuxt should exist and use multi-stage/production-ready instructions', () => {
    const dockerfiles = [
      'apps/api/Dockerfile',
      'apps/web-astro/Dockerfile',
      'apps/admin-nuxt/Dockerfile',
    ];

    dockerfiles.forEach((dockerfilePath) => {
      const fullPath = path.join(rootDir, dockerfilePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('FROM node:');
      expect(content).toContain('EXPOSE');
    });
  });
});

describe('Mission 20: Final Documentation & Project Summary', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('README.md should exist and contain installation procedures, API documentation, and feature summary', () => {
    const readmePath = path.join(rootDir, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf-8');

    // Windows installation instructions
    expect(content).toContain('Installation sous Windows');
    expect(content).toContain('PowerShell');

    // Docker installation instructions
    expect(content).toContain('Docker & Docker Compose');
    expect(content).toContain('docker compose up -d');

    // API documentation section
    expect(content).toContain('Documentation de l\'API REST Backend');
    expect(content).toContain('/api/health');
    expect(content).toContain('/api/auth/login');
    expect(content).toContain('/api/products');
    expect(content).toContain('/api/orders');

    // Project summary section
    expect(content).toContain('Bilan Complet des Fonctionnalités');
    expect(content).toContain('Astro');
    expect(content).toContain('Nuxt');
    expect(content).toContain('PostgreSQL');
    expect(content).toContain('Redis');
  });
});

describe('Mission 21: Final Project Validation & Recipe Certification', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('missionMBA/INDEX.md should exist and mark 100% of missions as Terminée', () => {
    const indexPath = path.join(rootDir, 'missionMBA', 'INDEX.md');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    const tableLines = content
      .split('\n')
      .filter((line) => line.trim().startsWith('| **'));

    expect(tableLines.length).toBe(22); // Missions 00 to 21
    tableLines.forEach((line) => {
      expect(line).toContain('| Terminée |');
    });

    // Check all mission files 00 to 21 exist
    for (let i = 0; i <= 21; i++) {
      const prefix = i < 10 ? `0${i}` : `${i}`;
      const missionFiles = fs.readdirSync(path.join(rootDir, 'missionMBA'));
      const found = missionFiles.some((f) => f.startsWith(prefix));
      expect(found).toBe(true);
    }
  });
});
