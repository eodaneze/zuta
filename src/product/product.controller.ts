import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        price: { type: 'number' },
        discountPrice: { type: 'number' },
        quantity: { type: 'number' },
        sku: { type: 'string' },
        hasVariants: { type: 'boolean' },
        variants: {
          type: 'string',
          example:
            '[{"size":"64GB","color":"Black","price":450000,"quantity":3}]',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['name', 'category', 'price', 'quantity', 'sku', 'images'],
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  async createProduct(
    @CurrentUser() user: any,
    @Body() dto: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const payload: CreateProductDto = {
      ...dto,
      tags: Array.isArray(dto.tags)
        ? dto.tags
        : dto.tags
          ? [dto.tags]
          : [],
      hasVariants:
        dto.hasVariants === true || dto.hasVariants === 'true' ? true : false,
      variants: dto.variants ? JSON.parse(dto.variants) : [],
      price: Number(dto.price),
      discountPrice:
        dto.discountPrice !== undefined && dto.discountPrice !== ''
          ? Number(dto.discountPrice)
          : null,
      quantity: Number(dto.quantity),
    };

    return this.productService.createProduct(user._id.toString(), payload, files);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my products' })
  getMyProducts(
    @CurrentUser() user: any,
    @Query() query: ProductQueryDto,
  ) {
    return this.productService.getMyProducts(user._id.toString(), query);
  }

  @Get('me/:productId')
  @ApiOperation({ summary: 'Get my single product' })
  getMySingleProduct(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.productService.getMySingleProduct(
      user._id.toString(),
      productId,
    );
  }

  @Patch('me/:productId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update my product' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        price: { type: 'number' },
        discountPrice: { type: 'number' },
        quantity: { type: 'number' },
        sku: { type: 'string' },
        hasVariants: { type: 'boolean' },
        variants: {
          type: 'string',
          example:
            '[{"size":"64GB","color":"Black","price":450000,"quantity":3}]',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateMyProduct(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const payload: UpdateProductDto = {
      ...dto,
      tags:
        dto.tags === undefined
          ? undefined
          : Array.isArray(dto.tags)
            ? dto.tags
            : [dto.tags],
      hasVariants:
        dto.hasVariants === undefined
          ? undefined
          : dto.hasVariants === true || dto.hasVariants === 'true',
      variants:
        dto.variants === undefined ? undefined : JSON.parse(dto.variants),
      price: dto.price !== undefined ? Number(dto.price) : undefined,
      discountPrice:
        dto.discountPrice !== undefined && dto.discountPrice !== ''
          ? Number(dto.discountPrice)
          : dto.discountPrice === ''
            ? null
            : undefined,
      quantity: dto.quantity !== undefined ? Number(dto.quantity) : undefined,
    };

    return this.productService.updateMyProduct(
      user._id.toString(),
      productId,
      payload,
      files,
    );
  }

  @Delete('me/:productId')
  @ApiOperation({ summary: 'Delete my product' })
  deleteMyProduct(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.productService.deleteMyProduct(user._id.toString(), productId);
  }
}