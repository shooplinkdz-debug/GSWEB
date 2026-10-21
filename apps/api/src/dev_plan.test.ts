import fs from 'fs';
import path from 'path';

describe('Mission 02: Strategic Development Plan & Tracking Verification', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('02_PLAN_DEVELOPPEMENT.md should exist and define milestones, 22 missions, and risk matrix', () => {
    const devPlanPath = path.join(rootDir, 'missionMBA', '02_PLAN_DEVELOPPEMENT.md');
    expect(fs.existsSync(devPlanPath)).toBe(true);

    const content = fs.readFileSync(devPlanPath, 'utf-8');

    // Milestones check
    expect(content).toContain('Jalon 1');
    expect(content).toContain('Jalon 2');
    expect(content).toContain('Jalon 3');
    expect(content).toContain('Jalon 4');
    expect(content).toContain('Jalon 5');
    expect(content).toContain('Jalon 6');
    expect(content).toContain('Jalon 7');

    // Key Algerian specifics & architecture concepts
    expect(content).toContain('58 Wilayas');
    expect(content).toContain('Cash on Delivery');
    expect(content).toContain('Matrice de Gestion des Risques');

    // All 22 missions check (00 to 21)
    for (let i = 0; i <= 21; i++) {
      const missionId = i < 10 ? `0${i}` : `${i}`;
      expect(content).toContain(`**${missionId}**`);
    }
  });

  test('INDEX.md should exist and mark Mission 02 as Terminée', () => {
    const indexPath = path.join(rootDir, 'missionMBA', 'INDEX.md');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // Check that Mission 02 is marked as Terminée
    expect(content).toMatch(/\|\s*\*\*02\*\*\s*\|\s*Plan de développement\s*\|.*\|\s*Terminée\s*\|/);
  });
});
