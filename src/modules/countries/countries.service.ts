import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly countriesRepository: Repository<Country>,
  ) {}

  async findAll(): Promise<Country[]> {
    return this.countriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Country> {
    const country = await this.countriesRepository.findOne({ where: { id } });
    if (!country) {
      throw new NotFoundException('الدولة غير موجودة');
    }
    return country;
  }
}
