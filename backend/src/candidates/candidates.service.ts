import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCandidateDto, UpdateCandidateDto, ModerateCandidateDto } from './dto/candidate.dto';
import { CandidateStatus, PaymentStatus, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async initiateCandidaturePayment(userId: string, createCandidateDto: CreateCandidateDto) {
    // Check if user already has a candidate profile
    const existingCandidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (existingCandidate) {
      throw new BadRequestException('User already has a candidate profile');
    }

    // Check if there's already a pending payment
    const existingPayment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { userId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already pending');
    }

    // Create candidate with PENDING_PAYMENT status
    const candidate = await this.prisma.candidate.create({
      data: {
        userId,
        stageName: createCandidateDto.stageName,
        bio: createCandidateDto.bio,
        status: CandidateStatus.PENDING_PAYMENT,
      },
    });

    // Create payment record
    const registrationFee = parseInt(
      this.configService.get('CANDIDATE_REGISTRATION_FEE') || '500',
    );

    const payment = await this.prisma.candidateRegistrationPayment.create({
      data: {
        candidateId: candidate.id,
        userId,
        amount: registrationFee,
        currency: 'XOF',
        status: PaymentStatus.PENDING,
        provider: createCandidateDto.paymentProvider,
      },
    });

    return {
      candidate,
      payment,
      message: 'Candidate registration initiated. Please complete payment.',
      paymentUrl: `/api/payments/candidate/${payment.id}/process`,
    };
  }

  async findAll(page: number = 1, limit: number = 10, status?: CandidateStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              votesReceived: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      data: candidates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        registrationPayment: true,
        _count: {
          select: {
            votesReceived: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async update(id: string, userId: string, userRole: string, updateCandidateDto: UpdateCandidateDto) {
    const candidate = await this.findOne(id);

    // Only candidate owner or admin can update
    if (candidate.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own candidate profile');
    }

    return this.prisma.candidate.update({
      where: { id },
      data: updateCandidateDto,
    });
  }

  async moderate(id: string, moderatedBy: string, moderateCandidateDto: ModerateCandidateDto) {
    const candidate = await this.findOne(id);

    // Check if payment is completed before validating
    if (moderateCandidateDto.status === CandidateStatus.ACTIVE) {
      const payment = await this.prisma.candidateRegistrationPayment.findUnique({
        where: { candidateId: id },
      });

      if (!payment || payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Cannot activate candidate without completed payment');
      }

      // Update user role to CANDIDATE
      await this.prisma.user.update({
        where: { id: candidate.userId },
        data: { role: UserRole.CANDIDATE },
      });
    }

    return this.prisma.candidate.update({
      where: { id },
      data: {
        status: moderateCandidateDto.status,
        rejectionReason: moderateCandidateDto.rejectionReason,
        moderatedAt: new Date(),
        moderatedBy,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.candidate.delete({
      where: { id },
    });

    return { message: 'Candidate deleted successfully' };
  }

  async getStats() {
    const [total, active, pending, suspended, rejected] = await Promise.all([
      this.prisma.candidate.count(),
      this.prisma.candidate.count({ where: { status: CandidateStatus.ACTIVE } }),
      this.prisma.candidate.count({ where: { status: CandidateStatus.PENDING_VALIDATION } }),
      this.prisma.candidate.count({ where: { status: CandidateStatus.SUSPENDED } }),
      this.prisma.candidate.count({ where: { status: CandidateStatus.REJECTED } }),
    ]);

    return {
      total,
      active,
      pending,
      suspended,
      rejected,
      pendingPayment: total - active - pending - suspended - rejected,
    };
  }

  async getMyCandidateProfile(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        registrationPayment: true,
        _count: {
          select: {
            votesReceived: true,
          },
        },
        leaderboardEntries: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('No candidate profile found for this user');
    }

    return candidate;
  }
}
