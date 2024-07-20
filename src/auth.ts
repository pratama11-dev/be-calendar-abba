
// // src/auth.ts
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// // import { findUser } from './userModel';

// interface UserPayload {
//   email: string;
// }

// export const generateToken = (user: UserPayload): string => {
//   return jwt.sign({ email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
// };

// export const authenticate = async (email: string, password: string): Promise<string> => {
//   const user = findUser(email);
//   if (user && await bcrypt.compare(password, user.password)) {
//     return generateToken(user);
//   }
//   throw new Error('Invalid credentials');
// };

// export const verifyToken = (token: string): UserPayload => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
//   } catch (err) {
//     throw new Error('Invalid token');
//   }
// };
