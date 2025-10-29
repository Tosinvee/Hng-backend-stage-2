import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';
import { prisma } from './prisma-client';

const SUMMARY_IMAGE_PATH =
  process.env.SUMMARY_IMAGE_PATH || './cache/summary.png';

export async function generateSummaryImage(lastRefreshedAt?: Date) {
  const top5 = await prisma.country.findMany({
    where: { estimated_gdp: { not: null } },
    orderBy: { estimated_gdp: 'desc' },
    take: 5,
    select: { name: true, estimated_gdp: true, last_refreshed_at: true },
  });

  const total = await prisma.country.count();
  const timestamp = (lastRefreshedAt ?? new Date()).toISOString();

  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('Countries Summary', 40, 60);

  ctx.font = '24px sans-serif';
  ctx.fillText(`Total countries: ${total}`, 40, 110);
  ctx.fillText(`Last refreshed: ${timestamp}`, 40, 145);

  ctx.font = '22px sans-serif';
  ctx.fillText('Top 5 by estimated GDP', 40, 200);

  ctx.font = '18px sans-serif';
  let y = 240;
  top5.forEach((t, idx) => {
    const gdp = Number(t.estimated_gdp ?? 0);
    ctx.fillText(
      `${idx + 1}. ${t.name} — ${gdp.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`,
      60,
      y
    );
    y += 34;
  });

  const dir = path.dirname(SUMMARY_IMAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUMMARY_IMAGE_PATH, canvas.toBuffer('image/png'));

  console.log(` Summary image saved to: ${SUMMARY_IMAGE_PATH}`);
}
