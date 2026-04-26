import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Vendor Portal",
  version: packageJson.version,
  copyright: `© ${currentYear}, Vendor Portal.`,
  meta: {
    title: "Vendor Portal",
    description: "Vendor Portal is a modern dashboard"
  },
};
