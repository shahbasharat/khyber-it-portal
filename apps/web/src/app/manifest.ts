import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khyber IT Operations Portal",
    short_name: "Khyber IT",
    description: "IT Operations Shift Handover and Incident Tracking Portal for The Khyber Himalayan Resort & Spa",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FDFBF7",
    theme_color: "#19433E",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
