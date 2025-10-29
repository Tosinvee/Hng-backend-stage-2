import { Request, Response, NextFunction } from 'express';
import {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
} from './country.service';
import fs from 'fs';
import path from 'path';
import { prisma } from './lib/prisma-client';

export class CountryController {
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await refreshCountries();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { region, currency, sort } = req.query;
      const countries = await getAllCountries({
        region: region as string,
        currency: currency as string,
        sort: sort as string,
      });

      res.status(200).json({
        total: countries.length,
        data: countries,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          error: 'Validation failed',
          details: { name: 'is required' },
        });
      }

      const country = await getCountryByName(name);
      if (!country) {
        return res.status(404).json({ error: 'Country not found' });
      }

      res.status(200).json(country);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          error: 'Validation failed',
          details: { name: 'is required' },
        });
      }

      const deleted = await deleteCountryByName(name);
      if (!deleted) {
        return res.status(404).json({ error: 'Country not found' });
      }

      res.status(200).json({ message: 'Country deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await prisma.country.count();
      const last = await prisma.country.findFirst({
        orderBy: { last_refreshed_at: 'desc' },
        select: { last_refreshed_at: true },
      });

      res.json({
        total_countries: total,
        last_refreshed_at: last?.last_refreshed_at ?? null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSummaryImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const imagePath =
        process.env.SUMMARY_IMAGE_PATH || path.join('cache', 'summary.png');

      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ error: 'Summary image not found' });
      }

      res.sendFile(path.resolve(imagePath));
    } catch (err) {
      next(err);
    }
  }
}
