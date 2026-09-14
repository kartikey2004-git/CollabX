declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "highlight.js/styles/*.css" {
  const content: Record<string, string>;
  export default content;
}