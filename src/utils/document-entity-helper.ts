import { Transform } from 'class-transformer';
export class EntityDocumentHelper {
  @Transform(
    (value) => {
      if ('value' in value) {
        return value.obj[value.key].toString();
      }
      return 'unknown value';
    },
    {
      toPlainOnly: true,
    },
  )
  public _id: string;
}
