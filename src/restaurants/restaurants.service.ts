import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private config: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.restaurant.findMany({
      include: {
        _count: { select: { categories: true, menuItems: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');
    if (!restaurant.isActive) throw new NotFoundException('Restoran hozir faol emas');
    return restaurant;
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        _count: { select: { categories: true, menuItems: true, users: true } },
        categories: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { menuItems: true } } },
        },
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');
    return restaurant;
  }

  async create(dto: CreateRestaurantDto, logoFile?: Express.Multer.File) {
    const existing = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Bu slug allaqachon mavjud');

    let logoUrl: string | undefined;
    if (logoFile) {
      logoUrl = await this.cloudinary.uploadFile(logoFile, 'qr-menu/logos');
    }

    return this.prisma.restaurant.create({
      data: { ...dto, logo: logoUrl },
    });
  }

  async update(id: string, dto: UpdateRestaurantDto, logoFile?: Express.Multer.File) {
    const restaurant = await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Bu slug allaqachon mavjud');
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      if (restaurant.logo) {
        const publicId = this.extractPublicId(restaurant.logo);
        if (publicId) await this.cloudinary.deleteFile(publicId);
      }
      logoUrl = await this.cloudinary.uploadFile(logoFile, 'qr-menu/logos');
    }

    return this.prisma.restaurant.update({
      where: { id },
      data: { ...dto, ...(logoUrl && { logo: logoUrl }) },
    });
  }

  async remove(id: string) {
    const restaurant = await this.findOne(id);
    if (restaurant.logo) {
      const publicId = this.extractPublicId(restaurant.logo);
      if (publicId) await this.cloudinary.deleteFile(publicId);
    }
    return this.prisma.restaurant.delete({ where: { id } });
  }

  private extractPublicId(url: string): string | null {
    // https://res.cloudinary.com/<cloud>/image/upload/v123/qr-menu/logos/abc.jpg
    // -> qr-menu/logos/abc
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return match ? match[1] : null;
  }

  async generateQRCode(slug: string): Promise<Buffer> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const menuUrl = `${frontendUrl}/menu/${slug}`;
    const qrBuffer = await QRCode.toBuffer(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return qrBuffer;
  }

  async getStats() {
    const [totalRestaurants, activeRestaurants, totalUsers, totalMenuItems] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.menuItem.count(),
    ]);
    return { totalRestaurants, activeRestaurants, totalUsers, totalMenuItems };
  }
}
