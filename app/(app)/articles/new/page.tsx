import { RoleGate } from "../../../../components/shared/role-gate";
import { ArticleForm } from "../../../../components/content/article-form";

export default function NewArticlePage() {
  return (
    <RoleGate
      mode="contributor"
      title="Contributor access required"
      description="You need CONTRIBUTOR or ADMIN access to create an article. Ask an admin to upgrade your role."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Article</h1>
          <p className="text-sm text-muted-foreground">
            Creates a draft — you&apos;ll submit it for review from your dashboard when ready.
          </p>
        </div>
        <ArticleForm />
      </div>
    </RoleGate>
  );
}
