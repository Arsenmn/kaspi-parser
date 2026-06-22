import { BadGatewayException } from '@nestjs/common';
import axios from 'axios';
import { Model } from 'mongoose';
import { Product } from './product.schema';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const insertMany = jest.fn();
  const model = { insertMany } as unknown as Model<Product>;
  const service = new ProductsService(model);

  afterEach(() => {
    jest.restoreAllMocks();
    insertMany.mockReset();
  });

  it('maps Kaspi products and saves them', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        data: [
          {
            title: 'Apple iPhone',
            unitPrice: 300000,
            shopLink: '/p/apple-iphone-1/',
          },
        ],
      },
    });
    insertMany.mockImplementation((products: Product[]) =>
      Promise.resolve(
        products.map((product) => ({ ...product, _id: 'mongo-id' })),
      ),
    );

    const result = await service.parse('iphone');

    expect(result[0]).toMatchObject({
      name: 'Apple iPhone',
      price: 300000,
      link: 'https://kaspi.kz/p/apple-iphone-1/',
    });
    expect(result[0].parsedAt).toBeInstanceOf(Date);
    expect(result[0]).not.toHaveProperty('_id');
    expect(insertMany).toHaveBeenCalledTimes(1);
  });

  it('throws BadGatewayException when Kaspi is unavailable', async () => {
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('network error'));

    await expect(service.parse('iphone')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
