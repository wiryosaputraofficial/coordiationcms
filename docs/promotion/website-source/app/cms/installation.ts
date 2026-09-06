export const CMS_VERSION = "0.1.0";
export const CMS_CREATE_COMMAND = `npx coordiation-cms@${CMS_VERSION} init my-site`;
export const CMS_INSTALL_COMMANDS = `${CMS_CREATE_COMMAND}\ncd my-site\nnpm install\nnpm run build\nnpm start`;
