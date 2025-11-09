import { HttpException, HttpStatus } from '@nestjs/common';

export class UserExistsException extends HttpException {
  constructor() {
    super(
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'Email already exists',
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'Invalid email or password',
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class UnverifiedUserException extends HttpException {
  constructor() {
    super(
      {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please verify your email before logging in',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor(tokenType: string) {
    super(
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          token: `Invalid ${tokenType} token`,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class UserNotFoundException extends HttpException {
  constructor(message: string = 'This email is not registered. Please register first to create an account.') {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: message,
        error: 'Unprocessable Entity',
        errors: {
          email: message,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}