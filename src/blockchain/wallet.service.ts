import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('WALLET_MASTER_KEY');
    if (!key) {
      throw new Error('WALLET_MASTER_KEY env is required');
    }

    // Derive a fixed 32-byte key for AES-256-GCM
    this.masterKey = crypto.createHash('sha256').update(key).digest();
  }

  createWallet(): { address: string; encryptedPrivateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    return {
      address: wallet.address,
      encryptedPrivateKey,
    };
  }

  decryptPrivateKey(encryptedPrivateKey: string): string {
    return this.decryptPrivateKeyInternal(encryptedPrivateKey);
  }

  private encryptPrivateKey(privateKeyHex: string): string {
    const iv = crypto.randomBytes(12); // recommended IV size for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    const plaintext = Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // payload = iv(12) | authTag(16) | ciphertext(N)
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  private decryptPrivateKeyInternal(payloadBase64: string): string {
    const buf = Buffer.from(payloadBase64, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return `0x${plaintext.toString('hex')}`;
  }
}

