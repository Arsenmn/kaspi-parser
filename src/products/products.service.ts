import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './product.schema';
import axios, { AxiosResponse } from 'axios';

interface KaspiProduct {
  title: string;
  unitPrice: number;
  shopLink: string;
}

interface KaspiResponse {
  data: KaspiProduct[];
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly kaspiUrl = 'https://kaspi.kz/yml/product-view/pl/results';

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async parse(query: string): Promise<Product[]> {
    const search = query.trim();

    if (!search) {
      this.logger.warn('Skipping parse because query is empty');
      return [];
    }

    this.logger.log(`Starting parse for "${search}"`);
    let response: AxiosResponse<KaspiResponse>;

    try {
      response = await axios.get<KaspiResponse>(this.kaspiUrl, {
        params: { text: search, page: 0 },
        headers: {
          Accept: 'application/json',
          Referer: `https://kaspi.kz/shop/search/?text=${encodeURIComponent(search)}`,
          'User-Agent': 'Mozilla/5.0',
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new BadGatewayException(
          `Kaspi вернул статус ${error.response.status}`,
        );
      }

      throw new BadGatewayException('Не удалось подключиться к Kaspi');
    }

    const result = response.data;
    const parsedAt = new Date();
    const products = (result.data ?? []).map((item) => ({
      name: item.title,
      price: item.unitPrice,
      link: new URL(item.shopLink, 'https://kaspi.kz').toString(),
      parsedAt,
    }));

    if (!products.length) {
      this.logger.warn(`Kaspi returned no products for "${search}"`);
      return [];
    }

    const savedProducts = await this.productModel.insertMany(products);
    this.logger.log(`Saved ${savedProducts.length} products for "${search}"`);

    return savedProducts.map(({ name, price, link, parsedAt }) => ({
      name,
      price,
      link,
      parsedAt,
    }));
  }

  findAll(): Promise<Product[]> {
    return this.productModel
      .find()
      .select({ _id: 0 })
      .sort({ parsedAt: -1 })
      .lean()
      .exec();
  }
}
