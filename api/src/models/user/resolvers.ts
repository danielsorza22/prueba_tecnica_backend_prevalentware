import { Resolver } from '@/types';
import { userDataLoader } from './dataLoaders';
import { checkSession } from '@/auth/checkSession';
import { changePassword, welcomeEmail } from '@/utils/emailTemplates';
import { SendMail } from '@/utils/nodemailer';
import { getSecretValueFunction } from '@/utils/getSecretValue';
import {
  createUserAuth0,
  getAuth0Token,
  resetPasswordAuth0,
} from '@/utils/auth0';
import { nanoid } from 'nanoid';

const secretArn = process.env.BACKEND_SECRETS || '';

const userResolvers: Resolver = {
  User: {
    account: async (parent, args, { db, session }) => {
      userDataLoader.accountLoader.clearAll();
      return await userDataLoader.accountLoader.load(parent.id);
    },
    sessions: async (parent, args, { db, session }) => {
      userDataLoader.sessionsLoader.clearAll();
      return await userDataLoader.sessionsLoader.load(parent.id);
    },
    role: async (parent, args, { db, session }) => {
      userDataLoader.roleLoader.clearAll();
      return await userDataLoader.roleLoader.load(parent.roleId);
    },
  },
  Query: {
    users: async (parent, args, { db, session }) => {
      return await db.user.findMany({});
    },
    user: async (parent, args, { db, session }) => {
      return await db.user.findUnique({
        where: {
          id: args.id,
        },
      });
    },
  },
  Mutation: {
    createUser: async (parent, args, { db, session }) => {
      const nextAuthCredentials = await getSecretValueFunction(secretArn);

      const { data } = args;
      const auth0Object = {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        password: nanoid(),
        connection: 'Username-Password-Authentication',
        verify_email: false,
        email_verified: false,
      };
      try {
        // Get Auth0 token
        const { access_token: accessToken, token_type: tokenType } =
          await getAuth0Token(nextAuthCredentials).then((resToken) => resToken);

        // Create user in Auth0
        const userData = await createUserAuth0(
          auth0Object,
          accessToken,
          tokenType,
          nextAuthCredentials?.AUTH0_DOMAIN
        ).then((resAuth) => resAuth);
        // Send welcome email
        const emailInfo = welcomeEmail({
          name: userData.name,
          email: data.email,
          password: userData.password,
        });
        SendMail({ email: data.email, ...emailInfo }, nextAuthCredentials);

        return db.user.create({
          data: {
            ...data,
            ...(data.emailVerified && {
              emailVerified: new Date(data.emailVerified).toISOString(),
            }),
            ///image: userData?.picture,
            accounts: {
              create: {
                type: 'oauth',
                provider: 'auth0',
                providerAccountId: userData.user_id,
              },
            },
          },
        });
      } catch (err) {
        return new Error(`Error creating user: ${err}`);
      }
    },
    changePassword: async (parent, args, { db }) => {
      try {
        const nextAuthCredentials = await getSecretValueFunction(secretArn);
        // Obtener el token de autenticación de Auth0 utilizando una función asincrónica y desestructuración
        const { access_token: accessToken, token_type: tokenType } =
          await getAuth0Token(nextAuthCredentials).then((resToken) => resToken);

        // Buscar el usuario en la base de datos utilizando el userId proporcionado en los argumentos
        const account = await db.account.findFirst({
          where: {
            userId: args.userId,
          },
          include: {
            user: true,
          },
        });

        // Crear un objeto de datos con el user_id necesario para el reseteo de contraseña
        const data = {
          user_id: account?.providerAccountId,
        };

        // Llamar a la función para resetear la contraseña en Auth0 usando el token de autenticación
        const resetPassword = await resetPasswordAuth0(
          data,
          accessToken,
          tokenType
        ).then((resAuth) => resAuth);

        // Si la respuesta del reseteo de contraseña contiene un ticket, enviar un correo electrónico al usuario
        if (resetPassword?.ticket) {
          // Obtener información del correo electrónico necesario para el cambio de contraseña
          const emailInfo = changePassword({
            // email: account?.user?.email ?? '', // Dirección de correo electrónico del usuario (aquí se puede cambiar por el correo del usuario real)
            url: resetPassword?.ticket, // URL del ticket para cambiar la contraseña
          });

          // Enviar el correo electrónico utilizando una función SendMail (se asume que está definida en otra parte del código)
          SendMail(
            { email: account?.user?.email, ...emailInfo },
            nextAuthCredentials
          ); // Aquí también se puede cambiar la dirección de correo por el del usuario real
        }

        // Devolver un mensaje indicando que el envío del correo fue exitoso
        return account?.user;
      } catch (error) {
        // En caso de que ocurra un error durante el proceso, devolver un objeto Error con un mensaje
        return new Error(`Error changing password: ${error}`);
      }
    },
    updateUser: async (parent, args, { db, session }) => {
      const check = await checkSession({
        session,
        resolverName: 'updateUser',
        resolverType: 'Mutation',
      });
      if (check?.auth) {
        return await db.user.update({
          where: {
            id: args.where.id,
          },
          data: {
            ...args.data,
            ...(args.data.emailVerified && {
              emailVerified: new Date(args.data.emailVerified).toISOString(),
            }),
          },
        });
      }
      return Error(check?.error);
    },
    upsertUser: async (parent, args, { db, session }) => {
      return await db.user.upsert({
        where: {
          id: args.where.id,
        },
        create: {
          ...args.data,
          emailVerified: new Date(args.data.emailVerified).toISOString(),
        },
        update: {
          ...args.data,
          ...(args.data.emailVerified && {
            emailVerified: new Date(args.data.emailVerified).toISOString(),
          }),
        },
      });
    },

    deleteUser: async (parent, args, { db, session }) => {
      return await db.user.delete({
        where: {
          id: args.where.id,
        },
      });
    },
  },
};
export { userResolvers };
