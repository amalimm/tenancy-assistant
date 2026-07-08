import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { SignInButton } from "@features/auth/sign-in-button"
import { TenantSignInForm } from "@features/auth/tenant-sign-in-form"

export interface HomeAuthTabsProps {
  defaultValue?: "admin" | "tenant"
  hasGoogleOAuthConfig: boolean
}

export function HomeAuthTabs({
  defaultValue = "tenant",
  hasGoogleOAuthConfig,
}: HomeAuthTabsProps) {
  return (
    <Tabs className="gap-5" defaultValue={defaultValue}>
      <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg bg-muted p-1">
        <TabsTrigger className="h-full rounded-md" value="tenant">
          Tenant
        </TabsTrigger>
        <TabsTrigger className="h-full rounded-md" value="admin">
          Admin
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-0 min-h-[13rem]" value="tenant">
        <TenantSignInForm hideIntro />
      </TabsContent>

      <TabsContent className="mt-0 min-h-[13rem]" value="admin">
        <div className="grid min-h-[13rem] content-start gap-3">
          <SignInButton
            className="h-11 w-full justify-center rounded-lg border bg-background text-sm font-medium shadow-sm hover:bg-muted"
            disabled={!hasGoogleOAuthConfig}
            mode="sign-in"
            variant="outline"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Admins manage tenants, bills, and payments.
          </p>
          {!hasGoogleOAuthConfig ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Google SSO is not configured.
            </p>
          ) : null}
        </div>
      </TabsContent>
    </Tabs>
  )
}
