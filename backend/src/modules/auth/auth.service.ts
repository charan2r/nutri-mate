import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { SignOptions } from 'jsonwebtoken';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register';

export type SafeUser = Pick<
  User,
  'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'
>;
type TokenPayload = { sub: string; email: string; type: 'access' | 'refresh' };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    if (await this.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.users.save(
        this.users.create({
          email,
          name: dto.name?.trim() || null,
          passwordHash,
        }),
      );
      return this.createAuthResponse(user);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.findByEmail(this.normalizeEmail(dto.email));
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(
        dto.refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { accessToken: await this.signAccessToken(user) };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return this.toSafeUser(user);
  }

  private async createAuthResponse(user: User) {
    return {
      user: this.toSafeUser(user),
      accessToken: await this.signAccessToken(user),
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          type: 'refresh',
        } satisfies TokenPayload,
        {
          secret: this.getRefreshTokenSecret(),
          expiresIn: this.getTokenExpiry('JWT_REFRESH_EXPIRES_IN', '30d'),
        },
      ),
    };
  }

  private signAccessToken(user: User) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      } satisfies TokenPayload,
      { expiresIn: this.getTokenExpiry('JWT_ACCESS_EXPIRES_IN', '15m') },
    );
  }

  private findByEmail(email: string) {
    return this.users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email })
      .getOne();
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  private getRefreshTokenSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }
  private getTokenExpiry(
    key: string,
    fallback: string,
  ): SignOptions['expiresIn'] {
    return this.configService.get<string>(
      key,
      fallback,
    ) as SignOptions['expiresIn'];
  }
  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
