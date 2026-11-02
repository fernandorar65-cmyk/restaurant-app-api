import {
  Controller,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ImageUploadsService } from '../../../application/images/image-uploads.service.js';
import { EmptyImageError } from '../../../domain/exceptions/media.errors.js';
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_MAX_BYTES,
} from '../../../domain/image-upload.js';
import { UploadedFileResponseDto } from '../dto/uploaded-file.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

/** The part of multer's file the endpoint reads (kept in memory). */
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

@ApiTags('media/uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly images: ImageUploadsService) {}

  // restaurantId goes in the query: guards run before the multipart body is read.
  @Authorize('catalog.manage', Scope.restaurant('query'))
  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    }),
  )
  @ApiOperation({
    summary: 'Subir una imagen de la sede (productos, carta)',
    description: `multipart/form-data con el campo "file". Tipos: ${ALLOWED_IMAGE_TYPES.join(', ')}; máximo ${IMAGE_MAX_BYTES / 1024 / 1024} MB. Devuelve la URL pública para guardarla en el registro. 503 si el almacenamiento no está configurado (STORAGE_PROVIDER)`,
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: UploadedFileResponseDto })
  async uploadImage(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<UploadedFileResponseDto> {
    if (!file) {
      throw new EmptyImageError();
    }
    const stored = await this.images.upload(restaurantId, {
      body: file.buffer,
      contentType: file.mimetype,
    });
    return UploadedFileResponseDto.from(stored);
  }
}
