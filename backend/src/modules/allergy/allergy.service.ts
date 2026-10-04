/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { Allergy } from './entities/allergy.entity';

@Injectable()
export class AllergyService {
  constructor(
    @InjectRepository(Allergy) private readonly allergies: Repository<Allergy>,
  ) {}

  findForUser(userId: string) {
    return this.allergies.find({
      where: { userId },
      order: { allergen: 'ASC' },
    });
  }

  async createForUser(userId: string, dto: CreateAllergyDto) {
    try {
      return await this.allergies.save(
        this.allergies.create({ userId, allergen: dto.allergen.trim() }),
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('This allergy already exists');
      }
      throw error;
    }
  }

  async removeForUser(userId: string, id: string) {
    const result = await this.allergies.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Allergy not found');
  }
}
