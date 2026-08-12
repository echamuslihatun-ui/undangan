/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      // Avatar akun Google (login via NextAuth GoogleProvider)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Gambar hasil upload ke Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Diperlukan untuk NextAuth v4 di Next.js 16+ (server components)
  serverExternalPackages: ["next-auth"],
};

module.exports = nextConfig;
