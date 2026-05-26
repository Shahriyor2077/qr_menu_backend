import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { menuItems: true } } },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: { orderBy: { createdAt: 'desc' } },
        _count: { select: { menuItems: true } },
      },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    return category;
  }

  async create(restaurantId: string, dto: CreateCategoryDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { plan: true, _count: { select: { categories: true } } },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');

    const planConfig = await this.prisma.planConfig.findUnique({ where: { name: restaurant.plan } });
    const limit = planConfig?.maxCategories ?? 3;
    if (restaurant._count.categories >= limit) {
      throw new BadRequestException(
        `"${restaurant.plan}" tarifida maksimal ${limit} ta kategoriya bo'lishi mumkin. Tarifni yangilang.`,
      );
    }

    const lastCategory = await this.prisma.category.findFirst({
      where: { restaurantId },
      orderBy: { order: 'desc' },
    });
    const order = dto.order ?? (lastCategory ? lastCategory.order + 1 : 0);
    return this.prisma.category.create({
      data: { ...dto, order, restaurantId },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (category.restaurantId !== restaurantId) throw new ForbiddenException();
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, restaurantId: string) {
    const category = await this.findOne(id);
    if (category.restaurantId !== restaurantId) throw new ForbiddenException();
    return this.prisma.category.delete({ where: { id } });
  }
}
