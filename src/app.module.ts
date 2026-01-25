import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
// import { KycModule } from './kyc/kyc.module'; // KYC module not found
import { AdminModule } from './admin/admin.module';
import { VendorModule } from './vendor/vendor.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import emailConfig from './email/config/email.config';
import fileConfig from './files/config/file.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { EmailModule } from './email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { DatabaseConfig } from './database/config/database-config.type';
import { UserModule } from './user/user.module';
import { KycModule } from './kyc/kyc.module';
import { InstallationModule } from './installation/installation.module';
import { DeviceModule } from './device/device.module';
import { EnergyReadingModule } from './energy-reading/energy-reading.module';
import { OracleModule } from './oracle/oracle.module';
import { RewardTransactionModule } from './reward-transaction/reward-transaction.module';
import { TokenMintEventModule } from './token-mint-event/token-mint-event.module';
import { WalletBalanceModule } from './wallet-balance/wallet-balance.module';
import { MarketplaceItemModule } from './marketplace-item/marketplace-item.module';
import { RedemptionModule } from './redemption/redemption.module';
import { CertificateModule } from './certificate/certificate.module';
import { PredictionModule } from './prediction/prediction.module';
import { PredictionResultModule } from './prediction-result/prediction-result.module';
import { EnergyRequestModule } from './energy-request/energy-request.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BlockchainModule } from './blockchain/blockchain.module';
// <database-block>
const infrastructureDatabaseModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    })
  : TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    });
// </database-block>

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, emailConfig, fileConfig],
      envFilePath: ['.env'],
    }),
    // Rate limiting: 10 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests
      },
    ]),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => {
        // In production (dist), use dist/i18n; in development, use src/i18n
        // nest-cli.json copies i18n/**/* to dist during build
        const isProduction =
          configService.get('app.nodeEnv', { infer: true }) === 'production';
        const i18nPath = isProduction
          ? path.join(__dirname, 'i18n')
          : path.join(process.cwd(), 'src', 'i18n');

        return {
          fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
            infer: true,
          }),
          loaderOptions: {
            path: i18nPath,
            watch: !isProduction, // Only watch in development
          },
        };
      },
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    FilesModule,
    AuthModule,
    // KycModule, // KYC module not found
    AdminModule,
    VendorModule,
    SessionModule,
    EmailModule,
    HomeModule,
    UserModule,
    KycModule,
    InstallationModule,
    DeviceModule,
    EnergyReadingModule,
    OracleModule,
    RewardTransactionModule,
    TokenMintEventModule,
    WalletBalanceModule,
    MarketplaceItemModule,
    RedemptionModule,
    CertificateModule,
    PredictionModule,
    PredictionResultModule,
    EnergyRequestModule,
    PredictionResultModule,
    EnergyRequestModule,
    BlockchainModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
