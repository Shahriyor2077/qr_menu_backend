import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, Res, HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  getStats() {
    return this.restaurantsService.getStats();
  }

  @Get('public/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }

  @Get(':id/qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getQRCode(@Param('id') id: string, @Res() res: Response) {
    const restaurant = await this.restaurantsService.findOne(id);
    const qrBuffer = await this.restaurantsService.generateQRCode(restaurant.slug);
    res.set({ 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${restaurant.slug}-qr.png"` });
    res.send(qrBuffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  create(
    @Body() dto: CreateRestaurantDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.restaurantsService.create(dto, logo);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.restaurantsService.update(id, dto, logo);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }
}
