import pool, { runMigrations, seedDatabase } from './index';

async function main() {
  console.log('--- Initialisation et Seeding de la Base de Données ---');
  try {
    console.log('1. Exécution des migrations SQL...');
    await runMigrations();

    console.log('2. Injection des données et comptes de test...');
    await seedDatabase();

    console.log('\n======================================================');
    console.log('  BASE DE DONNÉES ET COMPTES DE TEST CRÉÉS AVEC SUCCÈS');
    console.log('======================================================');
    console.log('\nComptes Utilisateurs Disponibles :');
    console.log('------------------------------------------------------');
    console.log('• ADMIN         : admin@webmanager.local        / AdminPass123!');
    console.log('• VENDOR 1      : vendor@techstore.local       / VendorPass123! (Boutique: TechStore Direct)');
    console.log('• VENDOR 2      : vendor2@fashionplus.local    / VendorPass123! (Boutique: Fashion Plus)');
    console.log('• MANAGER       : manager@webmanager.local      / ManagerPass123!');
    console.log('• CONFIRMATEUR  : confirmateur@webmanager.local / ConfirmateurPass123!');
    console.log('• DEVELOPER     : developer@webmanager.local   / DevPass123!');
    console.log('• CUSTOMER      : customer@webmanager.local     / CustomerPass123!');
    console.log('------------------------------------------------------\n');
  } catch (err) {
    console.error('Erreur lors du seeding de la base de données:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
