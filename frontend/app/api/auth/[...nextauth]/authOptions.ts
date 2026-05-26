import type { NextAuthOptions, Profile } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }: { token: any; account: any; profile?: Profile & { sub?: string } }) {
      if (account && profile) {
        token.googleId = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
