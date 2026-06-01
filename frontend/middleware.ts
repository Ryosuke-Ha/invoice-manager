import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/invoices/:path*",
    "/transportation/:path*",
    "/account-titles/:path*",
    "/templates/:path*",
  ],
};
