import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.planConfig.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const plan = await this.prisma.planConfig.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Tarif topilmadi');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const exists = await this.prisma.planConfig.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Bu nomli tarif allaqachon mavjud');
    return this.prisma.planConfig.create({ data: dto });
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);
    if (dto.name) {
      const exists = await this.prisma.planConfig.findUnique({ where: { name: dto.name } });
      if (exists && exists.id !== id) throw new ConflictException('Bu nomli tarif allaqachon mavjud');
    }
    return this.prisma.planConfig.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    const count = await this.prisma.restaurant.count({ where: { plan: plan.name } });
    if (count > 0) {
      throw new BadRequestException(
        `Bu tarifda ${count} ta restoran bor. Avval ularni boshqa tarifga o'tkazing.`,
      );
    }
    return this.prisma.planConfig.delete({ where: { id } });
  }
}
