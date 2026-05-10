import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../../modules/campaign/invitations/entities/campaign-invited-influencer.entity';
import { CampaignStatus } from '../../modules/campaign/enums';
import { InvitationStatus } from '../../modules/campaign/invitations/enums';

dotenv.config();

const INVITATION_IDS = [
  'e849a96a-717d-4908-b0b2-6edcd8ad8f4d',
  '28002c40-80eb-48fe-a45d-3fd8f85b60d6',
];

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
  synchronize: false,
});

function formatDateOnly(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);
  const campaignRepo = dataSource.getRepository(Campaign);

  const invitations = await invitationRepo.find({
    where: INVITATION_IDS.map((id) => ({ id })),
    relations: ['campaign'],
  });

  if (invitations.length === 0) {
    console.log('No invitations found for given IDs.');
    await dataSource.destroy();
    return;
  }

  for (const invitation of invitations) {
    const campaign = invitation.campaign;
    const periodDays = campaign.implementationPeriodDays ?? 10;

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + periodDays);

    await campaignRepo.update(campaign.id, {
      status: CampaignStatus.IMPLEMENTATION,
      implementationStartDate: formatDateOnly(today) as unknown as Date,
      implementationEndDate: formatDateOnly(endDate) as unknown as Date,
    });

    await invitationRepo.update(invitation.id, {
      status: InvitationStatus.PENDING,
    });

    console.log(
      `Reset invitation ${invitation.id} (campaign "${campaign.name}") — ` +
        `start=${formatDateOnly(today)}, end=${formatDateOnly(endDate)}, ` +
        `period=${periodDays} days`,
    );
  }

  console.log(`\nDone. Reset ${invitations.length} invitation(s).`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
