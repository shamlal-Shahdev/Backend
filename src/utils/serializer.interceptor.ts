import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import deepResolvePromises from './deep-resolver';

function shouldBypassDeepResolve(data: unknown): boolean {
  return (
    data instanceof StreamableFile ||
    Buffer.isBuffer(data) ||
    data instanceof Uint8Array
  );
}

@Injectable()
export class ResolvePromisesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      mergeMap(async (data) => {
        if (shouldBypassDeepResolve(data)) {
          return data;
        }
        return deepResolvePromises(data);
      }),
    );
  }
}
