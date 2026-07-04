declare module "@suseejs/static" {
  export interface GenerateRoutes {
    rootPath?: string;
    staticDir?: string;
    fileExt?: string[];
    warning?: boolean;
    ignore?: string[];
  }
  interface RouteObject {
    file: string;
    url: string;
    mime: string;
    typeofMime: string;
    base: string;
  }
  export interface StaticOptions extends GenerateRoutes {}
  export function serve(
    options: StaticOptions,
  ): (
    request: import("http").IncomingMessage,
    response: import("http").ServerResponse,
  ) => Promise<void>;
}
