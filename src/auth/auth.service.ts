import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

//create new user
  async register(name: string, email: string, password: string) {
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ name, email, password });
    await this.usersRepo.save(user);
    const token = this.signToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

//validate user credentials
  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return user;
  }

//login user
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const token = this.signToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

//sign JWT token
  signToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  //sanitize user object
  sanitizeUser(user: User) {
    const { passwordHash, ...rest } = user as any;
    rest.createdAt = user.createdAt?.toISOString?.() || new Date().toISOString();
    return rest;
  }
}
