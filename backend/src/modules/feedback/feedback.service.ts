import { preferenceMemory } from './preference-memory';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    const reasonTags = dto.reasonTags || dto.reasons || [];

    // Check if feedback already exists for this user and mealItem (if mealItemId is provided)
    if (dto.mealItemId) {
      const existing = await this.feedbackRepo.findOne({
        where: { userId, mealItemId: dto.mealItemId },
      });
      if (existing) {
        existing.liked = dto.liked !== undefined ? dto.liked : existing.liked;
        existing.rating =
          dto.rating !== undefined ? dto.rating : existing.rating;
        existing.comment =
          dto.comment !== undefined ? dto.comment : existing.comment;
        existing.reasonTags = reasonTags;
        existing.mealName = dto.mealName || existing.mealName;
        existing.mealType = dto.mealType || existing.mealType;
        return this.feedbackRepo.save(existing);
      }
    }

    const feedback = this.feedbackRepo.create({
      userId,
      mealItemId: dto.mealItemId || null,
      mealName: dto.mealName || null,
      mealType: dto.mealType || null,
      liked: dto.liked !== undefined ? dto.liked : null,
      rating: dto.rating !== undefined ? dto.rating : null,
      comment: dto.comment || null,
      reasonTags,
    });

    return this.feedbackRepo.save(feedback);
  }

  async findAllForUser(userId: string) {
    return this.feedbackRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPreferences(userId: string) {
    return preferenceMemory(await this.findAllForUser(userId));
  }

  async findOne(id: string, userId: string) {
    const feedback = await this.feedbackRepo.findOne({
      where: { id, userId },
    });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    return feedback;
  }

  async update(id: string, userId: string, dto: UpdateFeedbackDto) {
    const feedback = await this.findOne(id, userId);
    if (dto.liked !== undefined) feedback.liked = dto.liked;
    if (dto.rating !== undefined) feedback.rating = dto.rating;
    if (dto.comment !== undefined) feedback.comment = dto.comment;
    if (dto.reasonTags || dto.reasons) {
      feedback.reasonTags = dto.reasonTags || dto.reasons || [];
    }
    if (dto.mealName) feedback.mealName = dto.mealName;
    if (dto.mealType) feedback.mealType = dto.mealType;
    return this.feedbackRepo.save(feedback);
  }

  async remove(id: string, userId: string) {
    const feedback = await this.findOne(id, userId);
    return this.feedbackRepo.remove(feedback);
  }
}
