import { Controller, Get, Post, Query } from '@nestjs/common';
import { Product } from './product.schema';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('parse')
  parse(@Query('query') query = 'iphone'): Promise<Product[]> {
    return this.productsService.parse(query);
  }

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }
}
