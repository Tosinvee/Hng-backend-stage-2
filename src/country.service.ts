import axios from 'axios';
import { prisma } from './lib/prisma-client';
import { generateSummaryImage } from './lib/image-generator';
import dotenv from 'dotenv';

dotenv.config();

const COUNTRIES_API = process.env.COUNTRIES_API!;
const EXCHANGE_API = process.env.EXCHANGE_API!;
const TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS);

if (!COUNTRIES_API || !EXCHANGE_API || !TIMEOUT) {
  throw new Error('Missing required environment variables');
}

export async function refreshCountries() {
  let countriesData: any[] = [];
  let rates: Record<string, number> = {};

  try {
    const [cResp, eResp] = await Promise.all([
      axios.get(COUNTRIES_API, { timeout: TIMEOUT }),
      axios.get(EXCHANGE_API, { timeout: TIMEOUT }),
    ]);
    countriesData = Array.isArray(cResp.data) ? cResp.data : [];
    rates = eResp.data?.rates ?? {};
  } catch (err: any) {
    const which = err?.config?.url ?? 'External API';
    const e: any = new Error('External data source unavailable');
    e.status = 503;
    e.details = `Could not fetch data from ${which}`;
    throw e;
  }

  const now = new Date();
  const ops: any[] = [];

  for (const c of countriesData) {
    const name: string = String(c.name ?? '').trim();
    if (!name) continue;

    const capital = c.capital ?? null;
    const region = c.region ?? null;
    const populationNum = Number(c.population ?? 0);
    const flag_url = c.flag ?? null;

    let currency_code: string | null = null;
    let exchange_rate: number | null = null;
    let estimated_gdp: number | null = null;

    const currencies = Array.isArray(c.currencies) ? c.currencies : [];
    if (currencies.length === 0) {
      currency_code = null;
      exchange_rate = null;
      estimated_gdp = 0;
    } else {
      currency_code = currencies[0]?.code ?? null;
      if (currency_code && rates[currency_code] !== undefined) {
        exchange_rate = Number(rates[currency_code]);
        const multiplier = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
        estimated_gdp =
          exchange_rate !== 0
            ? (populationNum * multiplier) / exchange_rate
            : null;
      } else {
        exchange_rate = null;
        estimated_gdp = null;
      }
    }

    ops.push(
      prisma.country.upsert({
        where: { name },
        update: {
          capital,
          region,
          population: populationNum,
          currency_code,
          exchange_rate,
          estimated_gdp,
          flag_url,
          last_refreshed_at: now,
        },
        create: {
          name,
          capital,
          region,
          population: populationNum,
          currency_code,
          exchange_rate,
          estimated_gdp,
          flag_url,
          last_refreshed_at: now,
        },
      })
    );
  }

  try {
    await prisma.$transaction(ops);
  } catch (err: any) {
    console.error('DB transaction failed', err);
    const e: any = new Error('Internal server error');
    e.status = 500;
    throw e;
  }

  try {
    await generateSummaryImage(now);
  } catch (imgErr) {
    console.warn('Image generation failed', imgErr);
  }

  return {
    message: 'Refresh completed',
    total_countries: ops.length,
    last_refreshed_at: now,
  };
}

export async function getAllCountries(opts?: {
  region?: string;
  currency?: string;
  sort?: string;
}) {
  const where: any = {};
  if (opts?.region) where.region = opts.region;
  if (opts?.currency) where.currency_code = opts.currency;

  const orderBy: any = {};
  if (opts?.sort === 'gdp_desc') orderBy.estimated_gdp = 'desc';
  else if (opts?.sort === 'gdp_asc') orderBy.estimated_gdp = 'asc';
  else orderBy.name = 'asc';

  const countries = await prisma.country.findMany({ where, orderBy });
  return countries.map((c) => ({
    ...c,
    population:
      typeof c.population === 'bigint' ? Number(c.population) : c.population,
  }));
}

export async function getCountryByName(name: string) {
  const c = await prisma.country.findFirst({
    where: { name: name },
  });
  if (!c) return null;
  return {
    ...c,
    population:
      typeof c.population === 'bigint' ? Number(c.population) : c.population,
  };
}

export async function deleteCountryByName(name: string) {
  const existing = await prisma.country.findFirst({
    where: { name: name },
  });
  if (!existing) return false;
  await prisma.country.delete({ where: { id: existing.id } });
  return true;
}
