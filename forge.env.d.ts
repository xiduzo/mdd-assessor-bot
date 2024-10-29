/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare module "electron-squirrel-startup" {
  const Squirrel: boolean;
  export default Squirrel;
}
