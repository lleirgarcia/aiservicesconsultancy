type RequiredKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "BLOG_ADMIN_PASSWORD"
  | "BLOG_ADMIN_SESSION_SECRET"
  | "BLOG_PUBLIC_SITE_URL";

function read(key: RequiredKey): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

function require_(key: RequiredKey): string {
  const value = read(key);
  if (!value) {
    throw new Error(
      `[env] Falta la variable ${key}. Revisa .env.local (ver .env.example).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () => require_("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: () => require_("SUPABASE_SERVICE_ROLE_KEY"),
  blogAdminPassword: () => require_("BLOG_ADMIN_PASSWORD"),
  blogAdminSessionSecret: () => require_("BLOG_ADMIN_SESSION_SECRET"),
  blogPublicSiteUrl: () =>
    require_("BLOG_PUBLIC_SITE_URL").replace(/\/+$/, ""),
};

export function readOptional(key: RequiredKey): string | undefined {
  return read(key);
}
