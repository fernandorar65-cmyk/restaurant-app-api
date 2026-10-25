import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantDto } from './create-restaurant.dto.js';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}
