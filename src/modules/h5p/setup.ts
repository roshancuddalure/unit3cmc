import fs from "fs";
import path from "path";
import {
  H5PConfig,
  H5PEditor,
  H5PPlayer,
  UrlGenerator,
  fsImplementations
} from "@lumieducation/h5p-server";
import type { AppEnv } from "../../config/env";
import { renderEditorFrame, renderPlayerFrame } from "./renderers";

export interface H5PPaths {
  root: string;
  core: string;
  editor: string;
  libraries: string;
  content: string;
  temporary: string;
  userData: string;
  imports: string;
}

export interface H5PRuntime {
  config: H5PConfig;
  editor: H5PEditor;
  player: H5PPlayer;
  paths: H5PPaths;
}

function ensureDirectory(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function createH5PRuntime(env: AppEnv): H5PRuntime {
  const root = path.join(process.cwd(), "h5p-storage");
  const paths: H5PPaths = {
    root,
    core: path.join(root, "h5p-core"),
    editor: path.join(root, "h5p-editor"),
    libraries: path.join(root, "libraries"),
    content: path.join(root, "content"),
    temporary: path.join(root, "temporary"),
    userData: path.join(root, "user-data"),
    imports: path.join(root, "imports")
  };

  Object.values(paths).forEach((dir) => ensureDirectory(dir));

  const config = new H5PConfig(undefined, {
    ajaxUrl: "/api/h5p/ajax",
    // Keep H5P-generated URLs same-origin so local sessions still work when
    // the app is opened via localhost, 127.0.0.1, or another reverse-proxy host.
    baseUrl: "",
    contentFilesUrl: "/api/h5p/content-files",
    contentFilesUrlPlayerOverride: "/api/h5p/content-files/{{contentId}}",
    contentUserDataUrl: "/api/h5p/content-user-data",
    coreUrl: "/api/h5p/core",
    editorLibraryUrl: "/api/h5p/editor",
    librariesUrl: "/api/h5p/libraries",
    paramsUrl: "/api/h5p/params",
    playUrl: "/api/h5p/play",
    downloadUrl: "/api/h5p/download",
    setFinishedUrl: "/api/h5p/finished-data",
    temporaryFilesUrl: "/api/h5p/temporary-files",
    contentHubEnabled: false,
    setFinishedEnabled: true,
    contentUserStateSaveInterval: 5,
    maxFileSize: 50_000_000,
    maxTotalSize: 200_000_000,
    platformName: env.APP_NAME,
    platformVersion: "0.1.0"
  });

  const urlGenerator = new UrlGenerator(config);
  const libraryStorage = new fsImplementations.FileLibraryStorage(paths.libraries);
  const contentStorage = new fsImplementations.FileContentStorage(paths.content);
  const temporaryStorage = new fsImplementations.DirectoryTemporaryFileStorage(paths.temporary);
  const contentUserDataStorage = new fsImplementations.FileContentUserDataStorage(paths.userData);

  const editor = new H5PEditor(
    new fsImplementations.InMemoryStorage(),
    config,
    libraryStorage,
    contentStorage,
    temporaryStorage,
    undefined,
    urlGenerator,
    undefined,
    contentUserDataStorage
  );

  const player = new H5PPlayer(
    libraryStorage,
    contentStorage,
    config,
    undefined,
    urlGenerator,
    undefined,
    undefined,
    contentUserDataStorage
  );

  editor.setRenderer((model) => renderEditorFrame(model));
  player.setRenderer((model) => renderPlayerFrame(model, String(model.contentId), "/api/h5p/xapi"));

  return {
    config,
    editor,
    player,
    paths
  };
}
