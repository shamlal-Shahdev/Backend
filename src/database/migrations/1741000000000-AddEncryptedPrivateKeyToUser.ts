import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
export class AddEncryptedPrivateKeyToUser1741000000000
  implements MigrationInterface
{
  name = 'AddEncryptedPrivateKeyToUser1741000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'encrypted_private_key',
        type: 'text',
        isNullable: true,
      }),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'encrypted_private_key');
  }
}
