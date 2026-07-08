import { ShieldCheck } from "lucide-react"

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

      <TabsContent className="mt-0" value="tenant">
        <TenantSignInForm />
      </TabsContent>

      <TabsContent className="mt-0" value="admin">
        <div className="grid gap-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Admin access</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use the Google account registered as a household admin.
              </p>
            </div>
          </div>
          <SignInButton
            className="h-11 w-full justify-center rounded-lg border bg-background text-sm font-medium shadow-sm hover:bg-muted"
            disabled={!hasGoogleOAuthConfig}
            mode="sign-in"
            variant="outline"
          />
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
