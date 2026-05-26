import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async findAll(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Menu elementi topilmadi');
    return item;
  }

  async create(restaurantId: string, dto: CreateMenuItemDto, imageFile?: Express.Multer.File) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { plan: true, _count: { select: { menuItems: true } } },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');

    const planConfig = await this.prisma.planConfig.findUnique({ where: { name: restaurant.plan } });
    const limit = planConfig?.maxMenuItems ?? 15;
    if (restaurant._count.menuItems >= limit) {
      throw new BadRequestException(
        `"${restaurant.plan}" tarifida maksimal ${limit} ta taom bo'lishi mumkin. Tarifni yangilang.`,
      );
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category || category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Kategoriya sizning restoraningizga tegishli emas');
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      imageUrl = await this.cloudinary.uploadFile(imageFile, 'qr-menu/items');
    }

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        categoryId: dto.categoryId,
        restaurantId,
        isAvailable: dto.isAvailable ?? true,
        ...(imageUrl && { image: imageUrl }),
      },
      include: { category: true },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuItemDto, imageFile?: Express.Multer.File) {
    const item = await this.findOne(id);
    if (item.restaurantId !== restaurantId) throw new ForbiddenException();

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category || category.restaurantId !== restaurantId) {
        throw new ForbiddenException('Kategoriya sizning restoraningizga tegishli emas');
      }
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      if (item.image) {
        const publicId = this.extractPublicId(item.image);
        if (publicId) await this.cloudinary.deleteFile(publicId);
      }
      imageUrl = await this.cloudinary.uploadFile(imageFile, 'qr-menu/items');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...dto,
        ...(imageUrl && { image: imageUrl }),
      },
      include: { category: true },
    });
  }

  async remove(id: string, restaurantId: string) {
    const item = await this.findOne(id);
    if (item.restaurantId !== restaurantId) throw new ForbiddenException();
    if (item.image) {
      const publicId = this.extractPublicId(item.image);
      if (publicId) await this.cloudinary.deleteFile(publicId);
    }
    return this.prisma.menuItem.delete({ where: { id } });
  }

  private extractPublicId(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return match ? match[1] : null;
  }
}
