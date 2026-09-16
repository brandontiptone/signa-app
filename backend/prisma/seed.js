// Initialise les packs tarifaires + le tout premier compte Super Admin.
// Lancer avec : npm run prisma:seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const plans = [
    { nom: 'Starter', prixMensuel: 29.99, maxTechniciens: 4 },
    { nom: 'Pro', prixMensuel: 59.99, maxTechniciens: 10 },
    { nom: 'Business', prixMensuel: 99.99, maxTechniciens: 20 },
    { nom: 'Illimité', prixMensuel: 149.99, maxTechniciens: null },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { nom: plan.nom } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`Pack créé : ${plan.nom} (${plan.prixMensuel}€)`);
    }
  }

  const superAdminEmail = 'superadmin@signa.app';
  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuperAdmin) {
    const hash = await bcrypt.hash('ChangeMoi123!', 10);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hash,
        nom: 'Admin',
        prenom: 'Super',
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Super admin créé → email: ${superAdminEmail} / mot de passe: ChangeMoi123!`);
    console.log('⚠️  Change ce mot de passe immédiatement après la première connexion.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
