import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";

// Force refresh of environment variables
// Use the current port where the app is running (3006)
const NEXTAUTH_URL = 'http://localhost:3006';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Log the values for debugging
console.log("=== AUTH CONFIGURATION ===");
console.log("NEXTAUTH_URL:", NEXTAUTH_URL);
console.log("GOOGLE_CLIENT_ID is set:", !!GOOGLE_CLIENT_ID);

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/google`
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }

        try {
          const db = await dbConnect();
          if (!db) {
            console.error("MongoDB connection failed");
            return null;
          }
          
          // Find user by email
          const user = await UserModel.findOne({ email: credentials.email });
          console.log("Found user:", user ? "Yes" : "No");
          
          // Check if user exists and password matches
          if (user && credentials.password) {
            // If user has a password
            if (user.password) {
              const isValid = await bcrypt.compare(credentials.password, user.password);
              console.log("Password valid:", isValid ? "Yes" : "No");
              
              if (isValid) {
                return {
                  id: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  image: user.image || null,
                  role: user.role || 'user'
                };
              }
            }
          }
          
          console.log("Authentication failed");
          return null;
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google login, we need to create or update the user in our database
      if (account?.provider === 'google' && profile?.email) {
        try {
          await dbConnect();
          
          // Check if user exists
          let dbUser = await UserModel.findOne({ email: profile.email });
          
          if (!dbUser) {
            // Create new user if they don't exist
            dbUser = await UserModel.create({
              name: profile.name,
              email: profile.email,
              // For Google OAuth, the image is in profile.image or in profile.picture (from Google)
              image: profile.image || (profile as any).picture,
              role: 'user', // Default role
            });
            console.log("Created new user from Google login");
          } else {
            // Update existing user with latest info from Google
            dbUser.name = profile.name || dbUser.name;
            dbUser.image = profile.image || (profile as any).picture || dbUser.image;
            await dbUser.save();
            console.log("Updated existing user from Google login");
          }
          
          // Add role to user object
          user.role = dbUser.role;
          user.id = dbUser._id.toString();
        } catch (error) {
          console.error("Error in Google sign in callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        // Add role to token if it exists
        if (user.role) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Add role to session if it exists in token
        if (token.role) {
          session.user.role = token.role as string;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "your-secret-key-here",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
