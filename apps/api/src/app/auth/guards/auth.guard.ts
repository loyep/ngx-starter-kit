import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';
import { HttpAuthException } from '../auth.exception';
import { User, JwtToken } from '@ngx-starter-kit/models';

export const defaultOptions = {
  session: false,
  property: 'user',
  infoProperty: 'authInfo',
  callback: (err, user, info) => {
    if (err || !user) {
      // When Error occur, info is the error.
      throw new HttpAuthException(info.message, info.name);
    }
    return { user, info };
  },
};

const createPassportContext = (request, response) => (type, options) =>
  new Promise<{ user: User; info: JwtToken }>((resolve, reject) =>
    passport.authenticate(type, options, (err, user, info) => {
      try {
        return resolve(options.callback(err, user, info));
      } catch (err) {
        reject(err);
      }
    })(request, response, resolve)
  );

// TODO like https://github.com/nestjs/nest/blob/master/sample/19-auth/src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const [request, response] = [httpContext.getRequest(), httpContext.getResponse()];
    const passportFn = createPassportContext(request, response);
    const userAndInfo = await passportFn('jwt', defaultOptions);
    request[defaultOptions.property] = userAndInfo.user;
    request[defaultOptions.infoProperty] = userAndInfo.info;
    return true;
  }
}
